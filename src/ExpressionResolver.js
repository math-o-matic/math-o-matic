var ER = {};

var Type, Typevar, Fun, Funcall, Rule, Tee, Rulecall, Ruleset;
/*
 * 몇몇 노드가 이 모듈을 require 하므로 이 모듈이 노드들을 require 할 수 없다.
 * 그러므로 공통 조상이 이 모듈에 노드들을 넣어 주는 것으로 한다.
 * require 동작 방식의 한계라고 할 수 있다.
 */
ER.init = function (o) {
	Type = o.Type;
	Typevar = o.Typevar;
	Fun = o.Fun;
	Funcall = o.Funcall;
	Rule = o.Rule;
	Tee = o.Tee;
	Rulecall = o.Rulecall;
	Ruleset = o.Ruleset;
};

ER.isfree0 = function (expr, map) {
	if (expr._type == 'funcall') {
		return ER.isfree0(expr.fun, map)
			&& expr.args.map(arg => ER.isfree0(arg, map)).every(e => e);
	} else if (expr._type == 'fun') {
		if (!expr.expr || expr.name) return !map(expr);

		// 위의 expr.name을 지우면 이게 발생한다.
		if (expr.params.map(e => ER.isfree0(e, map)).some(e => !e))
			throw Error('Parameter collision');

		return ER.isfree0(expr.expr, map);
	} else if (expr._type == 'typevar') {
		return !map(expr);
	} else {
		throw Error(`Unknown type ${expr._type}`);
	}
};

ER.substitute0 = function (expr, map) {
	if (ER.isfree0(expr, map)) return expr;

	if (expr._type == 'funcall') {
		var fun2 = ER.substitute0(expr.fun, map);
		var args2 = expr.args.map(arg => ER.substitute0(arg, map));
		return new Funcall({
			fun: fun2,
			args: args2
		});
	} else if (expr._type == 'fun') {
		if (!expr.expr) return map(expr) || expr;

		var expr2 = ER.substitute0(expr.expr, map);

		return new Fun({
			name: false,
			type: expr.type,
			params: expr.params,
			expr: expr2
		});
	} else if (expr._type == 'typevar') {
		return map(expr) || expr;
	} else {
		throw Error(`Unknown type ${expr._type}`);
	}
};

ER.substitute1 = function (expr, map) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args.map(arg => ER.substitute0(arg, map));
		return new Rulecall({
			rule, args
		});
	} else if (expr._type == 'tee') {
		var left = expr.left.map(e => ER.substitute0(e, map));
		var right = ER.substitute0(expr.right, map);

		return new Tee({
			left, right
		});
	} else {
		throw Error(`Unknown type ${expr._type}`);
	}
};

// 네임드도 푼다. 한 번만.
ER.expand0FuncallOnce = function (expr) {
	if (expr._type == 'funcall') {
		var map = param => expr.args[expr.fun.params.indexOf(param)];

		if (expr.fun._type == 'funcall') {
			var fun = ER.expand0FuncallOnce(expr.fun);
			return new Funcall({
				fun,
				args: expr.args
			});
		}

		if (!expr.fun.expr)
			throw Error('Could not expand');

		return ER.substitute0(expr.fun.expr, map);
	}

	throw Error('Could not expand');
};

// 네임드는 안 푼다. 재귀적.
ER.expand0Funcalls = function (expr) {
	if (expr._type == 'funcall') {
		var fun = ER.expand0Funcalls(expr.fun);
		var args = expr.args.map(ER.expand0Funcalls);

		if (fun.name)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return ER.expand0Funcalls(ER.substitute0(fun.expr, map));
	} else if (expr._type == 'fun' && !expr.name) {
		var expr2 = ER.expand0Funcalls(expr.expr);
		return new Fun({
			name: false,
			type: expr.type,
			params: expr.params,
			expr: expr2
		});
	} else {
		return expr;
	}
};

ER.expand0 = function (expr) {
	if (expr._type == 'funcall') {
		var fun = ER.expand0(expr.fun);
		var args = expr.args.map(ER.expand0);

		if (fun._type != 'fun' || !fun.expr)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return ER.expand0(ER.substitute0(fun.expr, map));
	} else if (expr._type == 'fun' && expr.expr) {
		var expr2 = ER.expand0(expr.expr);
		return new Fun({
			name: false,
			type: expr.type,
			params: expr.params,
			expr: expr2
		});
	} else {
		return expr;
	}
};

// expand0은 하지 않음. rule 단계에서만 풀음.
ER.expand1 = function (expr) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args;

		var map = param => args[rule.params.indexOf(param)];

		return ER.expand1(ER.substitute1(rule.expr, map));
	} else if (expr._type == 'tee') {
		return expr;
	} else if (expr._type == 'rule') {
		var expr2 = ER.expand1(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		});
	} else throw Error('Unknown expr1');
};

// expr0의 funcall까지 풀음.
ER.expand1Funcalls = function (expr) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args.map(ER.expand0Funcalls);

		var map = param => args[rule.params.indexOf(param)];

		return ER.expand1Funcalls(ER.substitute1(rule.expr, map));
	} else if (expr._type == 'tee') {
		var left = expr.left.map(ER.expand0Funcalls);
		var right = ER.expand0Funcalls(expr.right);
		return new Tee({left, right});
	} else if (expr._type == 'rule') {
		var expr2 = ER.expand1Funcalls(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		});
	} else throw Error('Unknown expr1');
};

// expr0까지 최대로 풀음.
ER.expand1Full = function (expr) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args.map(ER.expand0);

		var map = param => args[rule.params.indexOf(param)];

		return ER.expand1Full(ER.substitute1(rule.expr, map));
	} else if (expr._type == 'tee') {
		var left = expr.left.map(ER.expand0);
		var right = ER.expand0(expr.right);
		return new Tee({left, right});
	} else if (expr._type == 'rule') {
		var expr2 = ER.expand1Full(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		});
	} else throw Error('Unknown expr1');
};

ER.equals0 = function (a, b) {
	function recurse(a, b, depth) {
		if (a._type == 'funcall' && b._type == 'funcall') {
			if (a.fun._type == 'funcall') return recurseWrap(
				ER.expand0FuncallOnce(a), b, depth + 1
			);

			if (b.fun._type == 'funcall') return recurseWrap(
				a, ER.expand0FuncallOnce(b), depth + 1
			);

			if (!a.fun.expr && !b.fun.expr) {
				if (a.fun != b.fun) return false;
				for (var i = 0; i < a.args.length; i++) {
					if (!recurseWrap(a.args[i], b.args[i], depth + 1)) return false;
				}
				return true;
			}

			if (a.fun.expr) return recurseWrap(
				ER.expand0FuncallOnce(a), b, depth + 1
			);

			return recurseWrap(
				a, ER.expand0FuncallOnce(b), depth + 1
			);
		}

		if (a._type == 'funcall') {
			if (a.fun._type == 'funcall') return recurseWrap(
				ER.expand0FuncallOnce(a), b, depth + 1
			);

			if (!a.fun.expr) return false;
			return recurseWrap(
				ER.expand0FuncallOnce(a), b, depth + 1
			);
		}

		if (b._type == 'funcall') {
			if (b.fun._type == 'funcall') return recurseWrap(
				a, ER.expand0FuncallOnce(b), depth + 1
			);

			if (!b.fun.expr) return false;
			return recurseWrap(
				a, ER.expand0FuncallOnce(b), depth + 1
			);
		}

		if (!a.type.equals(b.type)) return false;

		if (a.type.isFunctional) {
			var placeholders = Array(a.type.resolve().from.length).fill().map((_, i) =>
				new Typevar({
					type: a.type.resolve().from[i],
					name: '$' + i
				})
			);

			return recurseWrap(
				new Funcall({
					fun: a,
					args: placeholders
				}),
				new Funcall({
					fun: b,
					args: placeholders
				}),
				depth + 1
			);
		}

		return a == b;
	}

	function recurseWrap(a, b, depth) {
		// console.log(`${depth}\n${a}\n\n${b}`);
		var ret = recurse(a, b, depth);
		// console.log(`${depth}\n${a}\n\n${b}\n${ret}`);
		return ret;
	}

	return recurseWrap(a, b, 0);
};

ER.chain = function (tees) {
	return ER.expand1Funcalls(tees.reduceRight((r, l) => {
		for (var i = 0; i < r.left.length; i++) {
			if (ER.equals0(l.right, r.left[i])) {
				var newleft = r.left.slice(0, i)
					.concat(l.left)
					.concat(r.left.slice(i + 1));

				return new Tee({
					left: newleft,
					right: r.right
				});
			}
		}

		throw Error(`Link failed:\n\n${l},\n\n${r}\n`);
	}));
};

module.exports = ER;