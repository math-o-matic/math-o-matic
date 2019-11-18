var Type, Typevar, Fun, Funcall, Rule, Yield, Rulecall, Ruleset;

var Translator = {};

Translator.init = function (o) {
	Type = o.Type;
	Typevar = o.Typevar;
	Fun = o.Fun;
	Funcall = o.Funcall;
	Rule = o.Rule;
	Yield = o.Yield;
	Rulecall = o.Rulecall;
	Ruleset = o.Ruleset;
}

Translator.isfree0 = function (expr, map) {
	if (expr._type == 'funcall') {
		return Translator.isfree0(expr.fun, map)
			&& expr.args.map(arg => Translator.isfree0(arg, map)).every(e => e);
	} else if (expr._type == 'fun') {
		if (expr.atomic || !expr.anonymous) return !map(expr);
		return Translator.isfree0(expr.expr, map);
	} else if (expr._type == 'typevar') {
		return !map(expr);
	} else {
		throw Error(`Unknown type ${expr._type}`);
	}
}

Translator.substitute0 = function (expr, map) {
	if (Translator.isfree0(expr, map)) return expr;

	if (expr._type == 'funcall') {
		var fun2 = Translator.substitute0(expr.fun, map);
		var args2 = expr.args.map(arg => Translator.substitute0(arg, map));
		return new Funcall({
			fun: fun2,
			args: args2
		});
	} else if (expr._type == 'fun') {
		if (expr.atomic) return map(expr) || expr;

		var expr2 = Translator.substitute0(expr.expr, map);

		return new Fun({
			anonymous: true,
			type: expr.type,
			atomic: false,
			params: expr.params,
			expr: expr2
		});
	} else if (expr._type == 'typevar') {
		return map(expr) || expr;
	} else {
		throw Error(`Unknown type ${expr._type}`);
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
	} else {
		throw Error(`Unknown type ${expr._type}`);
	}
}

// 네임드도 푼다. 한 번만.
Translator.expand0FuncallOnce = function (expr) {
	if (expr._type == 'funcall') {
		var map = param => expr.args[expr.fun.params.indexOf(param)];

		if (!expr.fun.expr)
			return expr;

		return Translator.substitute0(expr.fun.expr, map);
	} else {
		return expr;
	}
}

// 네임드는 안 푼다. 재귀적.
Translator.expand0Funcalls = function (expr) {
	if (expr._type == 'funcall') {
		var fun = Translator.expand0Funcalls(expr.fun);
		var args = expr.args.map(Translator.expand0Funcalls);

		if (!fun.anonymous)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return Translator.expand0Funcalls(Translator.substitute0(fun.expr, map));
	} else if (expr._type == 'fun' && expr.anonymous) {
		var expr2 = Translator.expand0Funcalls(expr.expr);
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

	var cache = [];

	// https://stackoverflow.com/a/29018745
	function search(a, b) {
		var m = 0;
		var n = cache.length - 1;
		while (m <= n) {
			var k = (n + m) >> 1;
			var c = cache[k][0], d = cache[k][1];

			if (a > c || (a == c && b > d)) {
				m = k + 1;
			} else if (a < c || (a == c && b < d)) {
				n = k - 1;
			} else {
				return k;
			}
		}

		return ~m; // -m - 1
	}

	function addCache(a, b, v) {
		var aid = a._id, bid = b._id;

		if (aid > bid)
			[aid, bid] = [bid, aid];

		var i = search(aid, bid);

		if (i < 0)
			cache.splice(~i, 0, [aid, bid, v]);
	}

	function getCache(a, b) {
		var aid = a._id, bid = b._id;

		if (aid > bid)
			[aid, bid] = [bid, aid];

		var i = search(aid, bid);

		if (i < 0) return;

		return cache[i][2];
	}

	function recurse(a, b, depth) {
		// console.log(`${depth}\n${a}\n\n${b}`);

		if (a == b) return true;
		if (a._type == 'typevar' || b._type == 'typevar') return a == b;
		if (!a.type.equals(b.type)) return false;

		if (a._type == 'funcall' && b._type == 'funcall') {
			if (a.fun == b.fun) {
				if (!a.fun.expr) {
					for (var i = 0; i < a.args.length; i++)
						if (!cachedRecurse(a.args[i], b.args[i], depth+1)) return false;
					return true;
				}

				var foo = true;

				for (var i = 0; i < a.args.length; i++) {
					if (!cachedRecurse(
						a.args[i], b.args[i],depth+1
					)) {
						foo = false;
						break;
					}
				}

				if (foo) return true;

				return cachedRecurse(
					Translator.expand0FuncallOnce(a),
					Translator.expand0FuncallOnce(b),
					depth+1
				);
			}

			if (!a.fun.expr && !b.fun.expr) return false;

			if (!a.fun.expr && b.fun.expr)
				[a, b] = [b, a];

			if (b.fun.anonymous)
				[a, b] = [b, a];

			if (b.fun.expr && b.fun.expr._type == 'funcall' && b.fun.expr.fun == a.fun) {
				[a, b] = [b, a];
			}

			return cachedRecurse(
				Translator.expand0FuncallOnce(a),
				b,
				depth+1
			);
		}

		if (a._type == 'fun' && b._type == 'funcall')
			[a, b] = [b, a];

		while (a._type == 'funcall') {
			if (!a.fun.expr) return false;
			a = Translator.expand0FuncallOnce(a);
		}

		if (a._type != 'fun') return false;

		var placeholders = Array(a.type.from.length).fill().map((_, i) =>
			new Typevar({
				type: a.type.from[i],
				name: '$' + i
			})
		);

		return cachedRecurse(
			Translator.expand0FuncallOnce(new Funcall({
				fun: a,
				args: placeholders
			})),
			Translator.expand0FuncallOnce(new Funcall({
				fun: b,
				args: placeholders
			})),
			depth+1
		);
	}

	function cachedRecurse(a, b, depth) {
		var cached = getCache(a, b);
		if (typeof cached == 'boolean') {
			// console.warn(`${depth} (cache: ${cached})\n${a}\n\n${b}`);
			return cached;
		}

		var v = recurse(a, b, depth);

		// typevar는 캐싱 하지 않는다.
		if (!(a._type == 'typevar'))
			addCache(a, b, v);

		return v;
	}

	var ret = cachedRecurse(a, b, 0);
	// console.error(`result: ${ret}\ncache length: ${cache.length}`);
	return ret;
}

module.exports = Translator;