start
	= _ lines:line* _ {return lines}

line
	= typedef
	/ defv
	/ defun
	/ defrule
	/ defruleset

comment
	= "#" (!newline .)* _

typedef
	= "typedef" __ type:stype _ SEM _
	{
		return {
			_type: 'typedef',
			type
		}
	}

defv
	= typevar:typevar _ SEM _
	{
		return {
			_type: 'defv',
			typevar
		}
	}

defun
	=
		rettype:type __
		name:IDENT _
		params:(
			"(" _
			p:(
				head:typevar _
				tail:("," _ tv:typevar _ {return tv})*
				{return [head].concat(tail)}
			)?
			")" _
			{return p || []}
		)
		expr:(
			"{" _
			expr:expr0 _
			"}" _
			{return expr}
			/ SEM _ {return null}
		)
		{
			return {
				_type: 'defun',
				rettype,
				name,
				params,
				expr
			}
		}

defruleset
	=
		"native" __
		"ruleset" __
		name:IDENT _
		SEM _
		{
			return {
				_type: 'defruleset',
				name,
				native: true
			}
		}


defrule
	=
		"rule" __
		name:IDENT _
		params:(
			"(" _
			p:(
				head:typevar _
				tail:("," _ tv:typevar _ {return tv})*
				{return [head].concat(tail)}
			)?
			")" _
			{return p || []}
		)
		"{" _
		expr:expr2 _
		"}" _
		{
			return {
				_type: 'defrule',
				name,
				params,
				rules: expr.rules
			}
		}

// expr0... |- expr0
yield
	=
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
				_type: 'yield',
				left,
				right
			}
		}

// rule(...)
rulecall
	=
		rulesetName:(id:IDENT _ "." _ {return id})?
		name:IDENT _
		args:(
			"(" _
			a:(
				head:expr0 _
				tail:("," _ e:expr0 _ {return e})*
				{return [head].concat(tail)}
			)?
			")" _
			{return a || []}
		)
		{
			return {
				_type: 'rulecall',
				rulesetName,
				name,
				args
			}
		}

// forall(f, g)
// ((...) => ...)(f, g)
funcall
	=
		fun:(
			var
			/
			"(" _
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
			")" _
			{return a || []}
		)
		{
			return {
				_type: 'funcall',
				fun,
				args
			}
		}

// (T t) => f(t)
funexpr
	=
		params:(
			"(" _
			p:(
				head:typevar _
				tail:("," _ tv:typevar _ {return tv})*
				{return [head].concat(tail)}
			)?
			")" _
			{return p || []}
		)
		"=>" _
		expr:expr0
		{
			return {
				_type: 'funexpr',
				params,
				expr
			}
		}

// expr1 ~ ... ~ expr1
expr2
	=
		rules:(
			head:expr1 _
			tail:("~" _ e:expr1 _ {return e})*
			{return [head].concat(tail)}
		)
		{
			return {
				_type: 'chain',
				rules
			}
		}

expr1
	= yield
	/ rulecall

expr0
	= funcall
	/ funexpr
	/ var
	/ "(" _ e:expr0 _ ")" {return e}

typevar
	= type:type __ name:IDENT
	{
		return {
			_type: 'typevar',
			type,
			name
		}
	}

type
	= stype
	/ ftype

stype
	= name:IDENT
	{
		return {
			_type: 'type',
			ftype: false,
			name
		}
	}

ftype
	=
		"[" _
		from:(
			type:type {return [type]}
			/ (
				tt:(
					"(" _
					head: type _
					tail:("," _ t:type _ {return t})*
					")"
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
				to
			}
		}

var
	= name:IDENT
	{
		return {
			_type: 'var',
			name
		}
	}

keyword
	= "typedef"
	/ "rule"
	/ "ruleset"
	/ "native";

IDENT
	= !keyword id:[a-zA-Z0-9_]+ {return id.join('')}

newline = "\r\n" / "\r" / "\n"

// optional whitespace
_ = ([ \t\n\r] / comment)*

// mandatory whitespace
__ = ([ \t\n\r] / comment)+

SEM = ";"