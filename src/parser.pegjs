start =
	_ lines:(a:line _ {return a})* {return lines}

line =
	typedef
	/ defv
	/ defun
	/ defrule
	/ defruleset
	/ deflink

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

deflink =
	// native links
	doc:(documentation __)?
	axiomatic:("axiomatic" __)?
	"native" __
	"link" __
	name:IDENT _
	SEM
	{
		return {
			_type: 'deflink',
			doc: doc && doc[0],
			axiomatic: !!axiomatic,
			name,
			native: true,
			location: location()
		}
	}
	/
	// non-native links
	doc:(documentation __)?
	axiomatic:("axiomatic" __)?
	"link" __
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
	expr:expr2 _
	"}"
	{
		return {
			_type: 'deflink',
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

defrule =
	doc:(documentation __)?
	axiomatic:("axiomatic" __)?
	"rule" __
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
	expr:expr1 _
	"}"
	{
		return {
			_type: 'defrule',
			doc: doc && doc[0],
			axiomatic: !!axiomatic,
			name,
			params,
			expr,
			location: location()
		}
	}

// expr0... |- expr0
tee =
	left:(
		l:(
			head:expr0 _
			tail:("," _ e:expr0 _ {return e})*
			{return [head].concat(tail)}
		)? {return l || []}
	)
	"|-" _
	right:expr0
	{
		return {
			_type: 'tee',
			left,
			right,
			location: location()
		}
	}

// expr1... ||- expr1
tee2 =
	left:(
		l:(
			head:expr1 _
			tail:(";" _ e:expr1 _ {return e})*
			{return [head].concat(tail)}
		)? {return l || []}
	)
	"||-" _
	right:expr1
	{
		return {
			_type: 'tee2',
			left,
			right,
			location: location()
		}
	}

linkname =
	name:IDENT
	{
		return {
			_type: 'linkname',
			name
		}
	}

rulename =
	rulesetName:(id:IDENT _ "." _ {return id})?
	name:IDENT
	{
		return rulesetName
			? {
				_type: 'rulename',
				type: 'ruleset',
				rulesetName,
				name
			}
			: {
				_type: 'rulename',
				type: 'normal',
				name
			}
	}

// link[...]
// linkcall[...]
// (expr2)[...]
reduction2 =
	expr2:(
		linkcall
		/ linkname
		/ "(" _
		e:expr2 _
		")"
		{return e}
	) _
	args:(
		"[" _
		a:(
			head:expr1 _
			tail:(";" _ e:expr1 _ {return e})*
			{return [head].concat(tail)}
		)?
		"]"
		{return a || []}
	)
	{
		return {
			_type: 'reduction2',
			expr2,
			args,
			location: location()
		}
	}

// link(...)
// (expr2)(...)
linkcall =
	link:(
		linkname
		/ "(" _
		e:expr2 _
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
			_type: 'linkcall',
			link,
			args,
			location: location()
		}
	}

// rule(...)
// reduction2(...)
// (expr1)(...)
rulecall =
	rule:(
		reduction2
		/ rulename
		/ "(" _
		e:expr1 _
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
			_type: 'rulecall',
			rule,
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

// (T t) => { expr1 }
ruleexpr =
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
	"{" _ expr:expr1 _ "}"
	{
		return {
			_type: 'ruleexpr',
			doc: false,
			axiomatic: true,
			name: null,
			params,
			expr,
			location: location()
		}
	}

expr2 =
	tee2
	/ linkcall
	/ linkname

expr1 =
	// right associativity
	a:(
		expr1_dontusethis
		/ "(" _ c:expr1 _ ")" {return c}
	) _ "~" _ b:expr1
	{
		return {
			_type: 'reduction2',
			expr2: {
				_type: 'linkname',
				name: 'cut'
			},
			args: [a, b],
			location: location()
		}
	}
	/ expr1_dontusethis
	/ "(" _ a:expr1 _ ")" {return a}

// expr1 외에서 사용하지 마시오.
expr1_dontusethis =
	tee
	/ rulecall
	/ ruleexpr
	/ reduction2
	/ rulename

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
	name:IDENT
	{
		return {
			_type: 'var',
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