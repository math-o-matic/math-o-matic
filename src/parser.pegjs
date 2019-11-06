start
	= _ lines:line* _ {return lines}

line
	= typedef
	/ defv
	/ defun
	/ defrule

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
	= "defv" __ typevar:typevar _ SEM _
	{
		return {
			_type: 'defv',
			typevar
		}
	}

defun
	=
		"defun" __
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
			"=>" _
			expr:expr0 _
			{return expr}
		)?
		SEM _
		{
			return {
				_type: 'defun',
				rettype,
				name,
				params,
				expr
			}
		}

defrule
	=
		"defrule" __
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
		"=>" _
		expr:expr2 _
		SEM _
		{
			return {
				_type: 'defrule',
				name,
				params,
				rules: expr.rules
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
				name,
				args
			}
		}

expr0
	= funcall
	/ funexpr
	/ var
	/ "(" _ e:expr0 _ ")" {return e}

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

IDENT
	= id:[a-zA-Z0-9_]+ {return id.join('')}

newline = "\r\n" / "\r" / "\n"

// optional whitespace
_ = ([ \t\n\r] / comment)*

// mandatory whitespace
__ = ([ \t\n\r] / comment)+

SEM = ";"