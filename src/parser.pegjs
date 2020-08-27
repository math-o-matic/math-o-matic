start =
	_ lines:(a:line _ {return a})* {return lines}

line =
	typedef
	/ defv
	/ defun
	/ defruleset
	/ defschema

typedef =
	doc:(documentation __)?
	base:("base" __)?
	"type" __
	origin:(o:ftype __ {return o})?
	name:IDENT _ SEM
	{
		doc = doc && doc[0];
		
		return {
			_type: 'typedef',
			doc,
			base: !!base,
			origin,
			name,
			location: location()
		}
	}

defv =
	doc:(documentation __)? tex:(tex __)? type:type __ name:IDENT _ SEM
	{
		return {
			_type: 'defv',
			doc: doc && doc[0],
			tex: tex && tex[0],
			type,
			name,
			location: location()
		}
	}

defparam =
	type:type __ name:IDENT
	{
		return {
			_type: 'defv',
			type,
			name,
			location: location()
		}
	}

defun =
	doc:(documentation __)?
	tex:(tex __)?
	rettype:type __
	name:IDENT _
	params:(
		"(" _
		p:(
			head:defparam _
			tail:("," _ tv:defparam _ {return tv})*
			{return [head].concat(tail)}
		)?
		")" _
		{return p || []}
	)
	expr:(
		"{" _
		expr:expr0 _
		"}"
		{return expr}
		/ SEM {return null}
	)
	{
		return {
			_type: 'defun',
			doc: doc && doc[0],
			tex: tex && tex[0],
			rettype,
			name,
			params,
			expr,
			location: location()
		}
	}

defschema =
	// native schemata
	doc:(documentation __)?
	axiomatic:("axiomatic" __)?
	"native" __
	"schema" __
	name:IDENT _
	SEM
	{
		return {
			_type: 'defschema',
			doc: doc && doc[0],
			axiomatic: !!axiomatic,
			name,
			native: true,
			location: location()
		}
	}
	/
	// non-native schemata
	doc:(documentation __)?
	axiomatic:("axiomatic" __)?
	"schema" __
	name:IDENT _
	params:(
		"(" _
		p:(
			head:defparam _
			tail:("," _ tv:defparam _ {return tv})*
			{return [head].concat(tail)}
		)?
		")" _
		{return p || []}
	)
	"{" _
	expr:metaexpr _
	"}"
	{
		return {
			_type: 'defschema',
			doc: doc && doc[0],
			axiomatic: !!axiomatic,
			name,
			native: false,
			params,
			expr,
			location: location()
		}
	}

defruleset =
	doc:(documentation __)?
	axiomatic:("axiomatic" __)?
	"native" __
	"ruleset" __
	name:IDENT _
	SEM
	{
		return {
			_type: 'defruleset',
			doc: doc && doc[0],
			axiomatic: !!axiomatic,
			name,
			native: true,
			location: location()
		}
	}

// (metaexpr... |- metaexpr)
tee =
	"(" _
	left:(
		l:(
			head:metaexpr _
			tail:("," _ e:metaexpr _ {return e})*
			{return [head].concat(tail)}
		)? {return l || []}
	)
	"|-" _
	right:metaexpr _
	")"
	{
		return {
			_type: 'tee',
			left,
			right,
			location: location()
		}
	}

// var[...]
// schemacall[...]
// (metaexpr)[...]
reduction =
	subject:(
		schemacall
		/ var
		/ "(" _
		e:metaexpr _
		")"
		{return e}
	) _
	args:(
		"[" _
		a:(
			head:metaexpr _
			tail:("," _ e:metaexpr _ {return e})*
			{return [head].concat(tail)}
		)?
		"]"
		{return a || []}
	)
	{
		return {
			_type: 'reduction',
			subject,
			args,
			location: location()
		}
	}

// var(...)
// (metaexpr)(...)
schemacall =
	schema:(
		var
		/ "(" _
		e:metaexpr _
		")"
		{return e}
	) _
	args:(
		"(" _
		a:(
			head:expr0 _
			tail:("," _ e:expr0 _ {return e})*
			{return [head].concat(tail)}
		)?
		")"
		{return a || []}
	)
	{
		return {
			_type: 'schemacall',
			schema,
			args,
			location: location()
		}
	}

// forall(f, g)
// ((...) => ...)(f, g)
funcall =
	fun:(
		var
		/ "(" _
		e:expr0 _
		")"
		{return e}
	) _
	args:(
		"(" _
		a:(
			head:expr0 _
			tail:("," _ e:expr0 _ {return e})*
			{return [head].concat(tail)}
		)?
		")"
		{return a || []}
	)
	{
		return {
			_type: 'funcall',
			fun,
			args,
			location: location()
		}
	}

// (T t) => { f(t) }
funexpr =
	params:(
		"(" _
		p:(
			head:defparam _
			tail:("," _ tv:defparam _ {return tv})*
			{return [head].concat(tail)}
		)?
		")" _
		{return p || []}
	)
	"=>" _
	"{" _ expr:expr0 _ "}"
	{
		return {
			_type: 'funexpr',
			params,
			expr,
			location: location()
		}
	}

// (T t) => { metaexpr }
schemaexpr =
	params:(
		"(" _
		p:(
			head:defparam _
			tail:("," _ tv:defparam _ {return tv})*
			{return [head].concat(tail)}
		)?
		")" _
		{return p || []}
	)
	"=>" _
	"{" _ expr:metaexpr _ "}"
	{
		return {
			_type: 'schemaexpr',
			doc: false,
			axiomatic: true,
			name: null,
			params,
			expr,
			location: location()
		}
	}

metaexpr =
	// right associativity
	a:(
		metaexpr_dontusethis
		/ "(" _ c:metaexpr _ ")" {return c}
	) _ "~" _ b:metaexpr
	{
		return {
			_type: 'reduction',
			subject: {
				_type: 'var',
				type: 'normal',
				name: 'cut'
			},
			args: [a, b],
			location: location()
		}
	}
	/ metaexpr_dontusethis
	/ "(" _ a:metaexpr _ ")" {return a}

// metaexpr 외에서 사용하지 마시오.
// reduction은 schemacall보다 앞이어야 한다.
metaexpr_dontusethis =
	tee
	/ reduction
	/ schemacall
	/ schemaexpr
	/ var

expr0 =
	funcall
	/ funexpr
	/ var
	/ "(" _ e:expr0 _ ")" {return e}

type =
	stype
	/ ftype

stype =
	name:IDENT
	{
		return {
			_type: 'type',
			ftype: false,
			name,
			location: location()
		}
	}

ftype =
	"[" _
	from:(
		type:type {return [type]}
		/ (
			tt:(
				"(" _
				head: type
				tail:(_ "," _ t:type {return t})*
				_ ")"
				{return [head].concat(tail)}
			)
			{return tt}
		)
	) _
	"->" _
	to:type _
	"]"
	{
		return {
			_type: 'type',
			ftype: true,
			from,
			to,
			location: location()
		}
	}

var =
	rulesetName:(id:IDENT _ "." _ {return id})?
	name:IDENT
	{
		return rulesetName
			? {
				_type: 'var',
				type: 'ruleset',
				rulesetName,
				name
			}
			: {
				_type: 'var',
				type: 'normal',
				name
			}
	}

keyword =
	"axiomatic"
	/ "base"
	/ "link"
	/ "native"
	/ "rule"
	/ "ruleset"
	/ "schema"
	/ "type";

IDENT =
	!keyword id:[a-zA-Z0-9_]+ {return id.join('')}

documentation =
	'"' b:(!'"' a:. {return a})* '"' {
		return b.join('')
	}

tex =
	'$' b:(!'$' a:. {return a})* '$' {
		return b.join('')
	}

comment =
	"#" (!newline .)* _
	/ "//" (!newline .)* _
	/ "/*" (!"*/" .)* "*/" _

newline =
	"\r\n" / "\r" / "\n"

// optional whitespace
_ =
	([ \t\n\r] / comment)*

// mandatory whitespace
__ =
	([ \t\n\r] / comment)+

SEM =
	";"