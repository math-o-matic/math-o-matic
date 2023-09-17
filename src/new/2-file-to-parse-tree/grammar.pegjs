file =
	_
	defpackage:defpackage? _
	imports:(i:import _ {return i})*
	defsystems:(a:defsystem _ {return a})*
	{
		return {
			_type: 'file',
			defpackage,
			imports,
			defsystems
		}
	}

defpackage =
	'package' __
	name:$((ident '.')* ident) _
	sem
	{
		return {
			_type: 'defpackage',
			name,
			location: location()
		}
	}

import =
	'import' __
	name:$((ident '.')+ ident) _
	sem
	{
		return {
			_type: 'import',
			name,
			location: location()
		}
	}

defsystem =
	'system' __
	name:ident __
	extends_:(
		'extends' __
		a:(
			head:ident
			tail:(_ "," _ e:ident {return e})*
			{return [head].concat(tail)}
		) _
		{return a}
	)?
	'{' _
	lines:(a:line _ {return a})* _
	'}'
	{
		return {
			_type: 'defsystem',
			name,
			extends_: extends_ || [],
			lines,
			location: location()
		}
	}

line =
	deftype
	/ defvar
	/ defun
	/ defschema

evaluable =
	_ e:evaluable_internal _ {return e}

evaluable_internal =
	deftype
	/ defvar
	/ defun
	/ defschema
	/ metaexpr

deftype =
	doc:(d:documentation __ {return d})?
	"type" __
	name:ident _
	expr:('=' _ o:type _ {return o})?
	sem
	{
		return {
			_type: 'deftype',
			doc,
			name,
			expr,
			location: location()
		}
	}

defvar =
	doc:(d:documentation __ {return d})?
	tex:(t:tex __ {return t})?
	unsealed:('unsealed' __)?
	type:type __
	name:ident _
	expr:(
		"=" _
		expr:objectexpr _
		sem
		{return expr}
		/ sem {return null}
	)
	{
		return {
			_type: 'defvar',
			doc,
			tex,
			sealed: !unsealed,
			type,
			name,
			expr,
			location: location()
		}
	}

defparam =
	tex:(t:tex __ {return t})?
	type:type __
	name:ident
	{
		return {
			_type: 'defparam',
			tex,
			type,
			name,
			location: location()
		}
	}

defschemaparam =
	tex:(t:tex __ {return t})?
	type:type __
	name:ident
	selector:(_ ':' _  g:$('@' [a-z0-9_]+) {return g})?
	{
		return {
			_type: 'defschemaparam',
			tex,
			type,
			name,
			selector,
			location: location()
		}
	}

defun =
	doc:(d:documentation __ {return d})?
	tex_attributes:(t:tex_attributes __ {return t})?
	tex:(t:tex __ {return t})?
	unsealed:('unsealed' __)?
	rettype:type __
	name:ident _
	params:(
		"(" _
		p:(
			head:defparam
			tail:(_ "," _ tv:defparam {return tv})*
			{return [head].concat(tail)}
		)? _
		")" _
		{return p || []}
	)
	expr:(
		"{" _
		expr:objectexpr _
		"}"
		{return expr}
		/ sem {return null}
	)
	{
		return {
			_type: 'defun',
			doc,
			tex_attributes,
			tex,
			sealed: !unsealed,
			rettype,
			name,
			params,
			expr,
			location: location()
		}
	}

defschema =
	doc:(d:documentation __ {return d})?
	schemaType:('axiom' / 'theorem' / 'schema') __
	name:ident _
	params:(
		"(" _
		p:(
			head:defschemaparam
			tail:(_ "," _ tv:defschemaparam {return tv})*
			{return [head].concat(tail)}
		)? _
		")" _
		{return p || []}
	)
	using:(
		'using' __
		x:(
			head:ident
			tail:(_ ',' _ n:ident {return n})*
			{return [head].concat(tail)}
		) _
		{return x}
	)?
	"{" _
	defnamedsubproofs:(d:defnamedsubproof _ {return d})* _
	expr:metaexpr _
	"}"
	{
		return {
			_type: 'defschema',
			doc,
			schemaType,
			name,
			params,
			using: using || [],
			defnamedsubproofs,
			expr,
			location: location()
		}
	}

// foo > ...
// [foo] > ...
// [foo, baz] > ...
// ... > (expr)
// ... > var
// ... > schemacall
// ... > schemacall(?, ..., ?) as ... > ...
feed =
	left:(
		a:metaexpr_internal_2 {return [a]}
		/ "[" _
		b:(
			head:metaexpr
			tail:(_ ";" _ e:metaexpr {return e})*
			_
			{return [head].concat(tail)}
		)?
		"]"
		{return b || []}
	)
	right:(
		_ '>' _
		subject:(
			schemacall
			/ var
			/ "(" _ e:metaexpr _ ")" {return e}
		)
		args:(
			_ "(" _
			a:(
				head:('?' {return null} / objectexpr)
				tail:(_ "," _ e:('?' {return null} / objectexpr) {return e})*
				_
				{return [head].concat(tail)}
			)?
			")"
			{return a || []}
		)?
		as_:(
			__ 'as' __
			m:metaexpr_internal_2
			{return m}
		)?
		{return {subject, args, as_};}
	)+
	{
		var ret = {
			_type: 'feed',
			left,
			subject: right[0].subject,
			args: right[0].args,
			as_: right[0].as_,
			location: location()
		};

		for (var i = 1; i < right.length; i++) {
			ret = {
				_type: 'feed',
				left: [ret],
				subject: right[i].subject,
				args: right[i].args,
				as_: right[i].as_,
				location: location()
			}
		}
		
		return ret;
	}

// var(...)
// (expr)(...)
schemacall =
	schema:(
		var
		/ "(" _ e:metaexpr _ ")" {return e}
	) _
	args:(
		"(" _
		a:(
			head:objectexpr
			tail:(_ "," _ e:objectexpr {return e})*
			_
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
// (objectexpr)(f, g)
funcall =
	fun:(
		var
		/ "(" _ e:objectexpr _ ")" {return e}
	) _
	args:(
		"(" _
		a:(
			head:objectexpr
			tail:(_ "," _ e:objectexpr {return e})*
			_
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

// (T t) => expr_internal_1
// (T t) => { $foo = ...; expr }
schemaexpr =
	params:(
		"(" _
		p:(
			head:defparam
			tail:(_ "," _ tv:defparam {return tv})*
			_
			{return [head].concat(tail)}
		)?
		")" _
		{return p || []}
	)
	"=>" _
	body:(
		expr:metaexpr_internal_1
		{return {defnamedsubproofs: [], expr}}
		/ "{" _
		defnamedsubproofs: (d:defnamedsubproof _ {return d})*
		expr:metaexpr _
		"}"
		{return {defnamedsubproofs, expr}}
	)
	{
		return {
			_type: 'schemaexpr',
			params,
			body,
			location: location()
		}
	}

// (T t) => objectexpr
// (T t) => { objectexpr }
funexpr =
	params:(
		"(" _
		p:(
			head:defparam
			tail:(_ "," _ tv:defparam {return tv})*
			_
			{return [head].concat(tail)}
		)?
		")" _
		{return p || []}
	)
	"=>" _
	body:(
		objectexpr
		/ "{" _ e:objectexpr _ "}" {return e}
	)
	{
		return {
			_type: 'funexpr',
			params,
			body,
			location: location()
		}
	}

conditional =
	left:(
		l:(
			head:metaexpr_internal_1
			tail:(_ "," _ e:metaexpr_internal_1 {return e})*
			_
			{return [head].concat(tail)}
		)?
		{return l || []}
	)
	"|-" _
	right:(
		expr:metaexpr_internal_2
		{return {defnamedsubproofs: [], expr}}
		/ "{" _
		defnamedsubproofs: (d:defnamedsubproof _ {return d})*
		expr:metaexpr _
		"}"
		{return {defnamedsubproofs, expr}}
	)
	{
		return {
			_type: 'conditional',
			left,
			right,
			location: location()
		}
	}

with =
	'with' _ '(' _
	doc:(d:documentation __ {return d})?
	tex:(t:tex __ {return t})?
	type:type __
	varname:ident _
	"=" _
	varexpr:objectexpr _
	')' _ '{' _
	defnamedsubproofs: (d:defnamedsubproof _ {return d})* _
	expr:metaexpr _
	'}'
	{
		return {
			_type: 'with',
			doc,
			tex,
			type,
			varname,
			varexpr,
			defnamedsubproofs,
			expr,
			location: location()
		}
	}

metaexpr =
	feed
	/ metaexpr_internal_2

metaexpr_internal_2 =
	conditional
	/ metaexpr_internal_1

/*
 * The following should hold:
 *
 * - `schemacall` should precede `var`.
 *
 */
metaexpr_internal_1 =
	schemacall
	/ var
	/ schemaexpr
	/ with
	/ "(" _ e:metaexpr _ ")" {return e}

objectexpr =
	funcall
	/ funexpr
	/ var
	/ "(" _ e:objectexpr _ ")" {return e}

defnamedsubproof =
	name:dollar_ident _
	'=' _
	expr:metaexpr _
	sem
	{
		return {
			_type: 'defnamedsubproof',
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
			_type: 'stype',
			name,
			location: location()
		}
	}

ftype =
	"[" _
	from:(
		head:type
		tail:(_ "," _ t:type {return t})*
		{return [head].concat(tail)}
	) _
	"->" _
	to:type _
	"]"
	{
		return {
			_type: 'ftype',
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
			_type: '@var',
			name,
			location: location()
		}
	}

dollar_var =
	name:dollar_ident
	{
		return {
			_type: '$var',
			name,
			location: location()
		}
	}

plain_var =
	name:ident
	{
		return {
			_type: 'var',
			name,
			location: location()
		}
	}

keyword =
	'as'
	/ 'axiom'
	/ 'extends'
	/ 'import'
	/ 'package'
	/ 'schema'
	/ 'system'
	/ 'theorem'
	/ 'type'
	/ 'unsealed'
	/ 'using'
	/ 'with'

ident =
	$(!(keyword ![a-zA-Z0-9_]) [a-zA-Z0-9_]+)

at_ident =
	$('@' [a-zA-Z0-9_]+)

dollar_ident =
	$('$' [a-zA-Z0-9_]+)

documentation =
	'"' b:$(!'"' a:. {return a})* '"' {
		return b.replace(/\r\n|\r/g, '\n');
	}

tex_attributes =
	'[' _ 'precedence=' _ precedence:$[0-9]+ _ ']' {
		return {
			precedence: precedence * 1
		}
	}

tex =
	'$' b:$(!'$' a:. {return a})* '$' {
		return b.replace(/\r\n|\r/g, '\n');
	}

comment =
	"//" (!newline .)*
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