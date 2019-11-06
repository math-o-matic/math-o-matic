var Type, Typevar, Fun, Funcall, Rule, Yield, Rulecall;

var Translator = {};

Translator.init = function (o) {
	['Type', 'Typevar', 'Fun', 'Funcall', 'Rule', 'Yield', 'Rulecall']
		.forEach(e => eval(e + ' = o.' + e));
}

Translator.substitute0 = function (expr, map) {
	if (expr._type == 'funcall') {
		var fun2 = map(expr.fun) || expr.fun;
		var args2 = expr.args.map(arg => Translator.substitute0(arg, map));
		return new Funcall({
			fun: fun2,
			args: args2
		});
	} else if (expr._type == 'fun') {
		if (expr.atomic) return map(expr) || expr;
		if (expr.params.map(p => p == expr).some(e => e))
			throw Error(`Duplicate parameter found`);
		var expr2 = Translator.substitute0(expr.expr, map);
		return new Fun({
			anonymous: true,
			type: expr.type,
			atomic: false,
			params: expr.params,
			expr: expr2
		});
	} else {
		return map(expr) || expr;
	}
}

Translator.substitute1 = function (expr, map) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args.map(arg => Translator.substitute0(arg, map));
		return new Rulecall({
			rule, args
		});
	} else if (expr._type == 'yield') {
		var left = expr.left.map(e => Translator.substitute0(e, map));
		var right = Translator.substitute0(expr.right, map);

		return new Yield({
			left, right
		});
	} else throw Error(`wut`);
}

Translator.expand0Funcalls = function (expr) {
	if (expr._type == 'funcall') {
		var fun = Translator.expand0Funcalls(expr.fun);
		var args = expr.args.map(Translator.expand0Funcalls);

		if (!fun.anonymous)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return Translator.expand0Funcalls(Translator.substitute0(fun.expr, map));
	} else {
		return expr;
	}
}

Translator.expand0 = function (expr) {
	if (expr._type == 'funcall') {
		var fun = Translator.expand0(expr.fun);
		var args = expr.args.map(Translator.expand0);

		if (fun._type != 'fun' || fun.atomic)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return Translator.expand0(Translator.substitute0(fun.expr, map));
	} else if (expr._type == 'fun' && !expr.atomic) {
		var expr2 = Translator.expand0(expr.expr);
		return new Fun({
			anonymous: true,
			type: expr.type,
			atomic: false,
			params: expr.params,
			expr: expr2
		});
	} else {
		return expr;
	}
}

// expand0은 하지 않음. rule 단계에서만 풀음.
Translator.expand1 = function (expr) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args;

		var map = param => args[rule.params.indexOf(param)];

		return Translator.expand1(Translator.substitute1(rule.expr, map));
	} else if (expr._type == 'yield') {
		return expr;
	} else if (expr._type == 'rule') {
		var expr2 = Translator.expand1(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		})
	} else throw Error(`Unknown expr1`);
}

// expr0의 funcall까지 풀음.
Translator.expand1Funcalls = function (expr) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args.map(Translator.expand0Funcalls);

		var map = param => args[rule.params.indexOf(param)];

		return Translator.expand1Funcalls(Translator.substitute1(rule.expr, map));
	} else if (expr._type == 'yield') {
		var left = expr.left.map(Translator.expand0Funcalls);
		var right = Translator.expand0Funcalls(expr.right);
		return new Yield({left, right});
	} else if (expr._type == 'rule') {
		var expr2 = Translator.expand1Funcalls(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		})
	} else throw Error(`Unknown expr1`);
}

// expr0까지 최대로 풀음.
Translator.expand1Full = function (expr) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args.map(Translator.expand0);

		var map = param => args[rule.params.indexOf(param)];

		return Translator.expand1Full(Translator.substitute1(rule.expr, map));
	} else if (expr._type == 'yield') {
		var left = expr.left.map(Translator.expand0);
		var right = Translator.expand0(expr.right);
		return new Yield({left, right});
	} else if (expr._type == 'rule') {
		var expr2 = Translator.expand1Full(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		})
	} else throw Error(`Unknown expr1`);
}

Translator.expr0Equals = function (a, b) {
	a = Translator.expand0(a);
	b = Translator.expand0(b);

	if ((a._type == 'funcall') != (b._type == 'funcall')) return false;

	if (a._type == 'funcall') {
		if (a.fun != b.fun) return false;

		for (var i = 0; i < a.args.length; i++)
			if (!Translator.expr0Equals(a.args[i], b.args[i])) return false;
		return true;
	}

	if (a.type.isFunctional && b.type.isFunctional) {
		if (!a.type.equals(b.type)) return false;
		
		var placeholders = Array(a.type.from.length).fill().map((_, i) =>
			new Typevar(a.type.from[i], '$'));

		return Translator.expr0Equals(
			new Funcall({
				fun: a,
				args: placeholders
			}),
			new Funcall({
				fun: b,
				args: placeholders
			})
		);
	}

	return a == b;
}

module.exports = Translator;