start =
	_ lines:(a:line _ {return a})* {return lines}

line =
	typedef
	/ defv
	/ defun
	/ defruleset
	/ defschema

evaluable =
	_ e:evaluable_internal _ {return e}

evaluable_internal =
	typedef
	/ defv
	/ defun
	/ defruleset
	/ defschema
	/ metaexpr

typedef =
	doc:(documentation __)?
	base:("base" __)?
	"type" __
	origin:(o:ftype __ {return o})?
	name:ident _ sem
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
	doc:(documentation __)? tex:(tex __)? type:type __ name:ident _ sem
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
	tex:(tex __)? type:type __ name:ident
	{
		return {
			_type: 'defv',
			isParam: true,
			type,
			tex: tex && tex[0],
			name,
			location: location()
		}
	}

defschemaparam =
	tex:(tex __)? type:type __ name:ident
	guess:(_ ':' _ '@' g:$[a-z0-9_]+ {return g})?
	{
		return {
			_type: 'defv',
			isParam: true,
			guess,
			type,
			tex: tex && tex[0],
			name,
			location: location()
		}
	}
 
defun =
	doc:(documentation __)?
	tex:(tex __)?
	rettype:type __
	name:ident _
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
		/ sem {return null}
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
	name:ident _
	sem
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
	name:ident _
	params:(
		"(" _
		p:(
			head:defschemaparam _
			tail:("," _ tv:defschemaparam _ {return tv})*
			{return [head].concat(tail)}
		)?
		")" _
		{return p || []}
	)
	"{" _
	defdollars: (d:defdollar _ {return d})* _
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
			def$s: defdollars,
			expr,
			location: location()
		}
	}

defruleset =
	doc:(documentation __)?
	axiomatic:("axiomatic" __)?
	"native" __
	"ruleset" __
	name:ident _
	sem
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

// var[...]
// foo(...)[...]
// foo[...][...]
// (metaexpr)[...]
// schema(?, ...)[...]
reduction =
	subject:(
		schemacall
		/ var
		/ "(" _
		e:metaexpr _
		")"
		{return e}
	) _
	guesses:(
		"(" _
		a:(
			head:('?' {return null} / expr0) _
			tail:("," _ e:('?' {return null} / expr0) _ {return e})*
			{return [head].concat(tail)}
		)?
		")"
		{return a || []}
	)?
	leftargs:(
		"[" _
		a:(
			head:metaexpr _
			tail:("," _ e:metaexpr _ {return e})*
			{return [head].concat(tail)}
		)?
		"]"
		{return a || []}
	)+
	{
		var ret = {
			_type: 'reduction',
			subject,
			guesses,
			leftargs: leftargs[0],
			location: location()
		};

		for (var i = 1; i < leftargs.length; i++) {
			ret = {
				_type: 'reduction',
				subject: ret,
				guesses: null,
				leftargs: leftargs[i],
				location: location()
			};
		}

		return ret;
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
// (expr0)(f, g)
funcall =
	schema:(
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
			schema,
			args,
			location: location()
		}
	}

// (T t) => { expr0 }
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
	"{" _
	defdollars: (d:defdollar _ {return d})* _
	expr:metaexpr _
	"}"
	{
		return {
			_type: 'schemaexpr',
			params,
			def$s: defdollars,
			expr,
			location: location()
		}
	}

metaexpr =
	// right associativity
	a:(
		metaexpr_internal_1
	) _ "~" _ b:metaexpr
	{
		return {
			_type: 'reduction',
			subject: {
				_type: 'var',
				type: 'normal',
				name: 'cut',
				location: location()
			},
			leftargs: [a, b],
			location: location()
		}
	}
	/ metaexpr_internal_1

metaexpr_internal_1 =
	left:(
		l:(
			head:metaexpr_internal_2 _
			tail:("," _ e:metaexpr_internal_2 _ {return e})*
			{return [head].concat(tail)}
		)? {return l || []}
	)
	"|-" _
	defdollars: (d:defdollar _ {return d})* _
	right:metaexpr_internal_1
	{
		return {
			_type: 'tee',
			def$s: defdollars,
			left,
			right,
			location: location()
		}
	}
	/ metaexpr_internal_2

/*
 * 다음이 성립하여야 한다.
 *
 * - reduction이 schemacall보다 앞이다.
 * - schemacall이 var보다 앞이다.
 *
 */
metaexpr_internal_2 =
	reduction
	/ schemacall
	/ var
	/ schemaexpr
	/ "(" _ e:metaexpr _ ")" {return e}

expr0 =
	funcall
	/ funexpr
	/ var
	/ "(" _ e:expr0 _ ")" {return e}

defdollar =
	name:dollar_ident _
	'=' _
	expr:metaexpr _
	sem
	{
		return {
			_type: 'def$',
			name,
			expr,
			location: location()
		};
	}

type =
	stype
	/ ftype

stype =
	name:ident
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
	at_var
	/ dollar_var
	/ plain_var

at_var =
	name:at_ident
	{
		return {
			_type: 'var',
			type: '@',
			name: name.slice(1),
			location: location()
		}
	}

dollar_var =
	name:dollar_ident
	{
		return {
			_type: 'var',
			type: '$',
			name: name,
			location: location()
		}
	}

plain_var =
	rulesetName:(id:ident _ "." _ {return id})?
	name:ident
	{
		return rulesetName
			? {
				_type: 'var',
				type: 'ruleset',
				rulesetName,
				name,
				location: location()
			}
			: {
				_type: 'var',
				type: 'normal',
				name,
				location: location()
			}
	}

keyword =
	"axiomatic"
	/ "base"
	/ "native"
	/ "ruleset"
	/ "schema"
	/ "type";

ident =
	$(!keyword [a-zA-Z0-9_]+)

at_ident =
	$('@' [a-zA-Z0-9_]+)

dollar_ident =
	$('$' [a-zA-Z0-9_]+)

documentation =
	'"' b:$(!'"' a:. {return a})* '"' {
		return b
	}

tex =
	'$' b:$(!'$' a:. {return a})* '$' {
		return b
	}

comment =
	"#" (!newline .)*
	/ "//" (!newline .)*
	/ "/*" (!"*/" .)* "*/"

newline =
	"\r\n" / "\r" / "\n"

// optional whitespace
_ =
	([ \t\n\r] / comment)*

// mandatory whitespace
__ =
	([ \t\n\r] / comment)+

sem =
	";"