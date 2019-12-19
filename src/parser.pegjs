start
	= _ lines:line* _ {return lines}

line
	= typedef
	/ defv
	/ defun
	/ defrule
	/ defruleset
	/ deflink

typedef
	= "typedef" __ type:stype _ SEM _
	{
		return {
			_type: 'typedef',
			type,
			location: location()
		}
	}

defv
	= typevar:typevar _ SEM _
	{
		return {
			_type: 'defv',
			typevar,
			location: location()
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
				expr,
				location: location()
			}
		}

deflink
	=
		"native" __
		"link" __
		name:IDENT _
		SEM _
		{
			return {
				_type: 'deflink',
				name,
				native: true,
				location: location()
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
				native: true,
				location: location()
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
				rules: expr.rules,
				location: location()
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
				right,
				location: location()
			}
		}

rulename
	=
		name:(
			(
				linkName:IDENT _
				"[" _
				rule:rulename _
				"]" _
				{
					return {
						_type: 'rulename',
						type: 'link',
						linkName,
						rule
					}
				}
			)
			/
			(
				rulesetName:(id:IDENT _ "." _ {return id})?
				name:IDENT _
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
			)
		)

// rule(...)
rulecall
	=
		rule:rulename
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
				rule,
				args,
				location: location()
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
				args,
				location: location()
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
				expr,
				location: location()
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
			name,
			location: location()
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
			name,
			location: location()
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
				to,
				location: location()
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

comment
	= "#" (!newline .)* _
	/ "//" (!newline .)* _
	/ "/*" (!"*/" .)* "*/" _

newline = "\r\n" / "\r" / "\n"

// optional whitespace
_ = ([ \t\n\r] / comment)*

// mandatory whitespace
__ = ([ \t\n\r] / comment)+

SEM = ";"