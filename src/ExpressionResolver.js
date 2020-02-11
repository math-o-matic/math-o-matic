var ER = {};

var Type, Typevar, Fun, Funcall, Rule, Yield, Rulecall, Ruleset;
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
	Yield = o.Yield;
	Rulecall = o.Rulecall;
	Ruleset = o.Ruleset;
};

ER.isfree0 = function (expr, map) {
	if (expr._type == 'funcall') {
		return ER.isfree0(expr.fun, map)
			&& expr.args.map(arg => ER.isfree0(arg, map)).every(e => e);
	} else if (expr._type == 'fun') {
		if (expr.atomic || !expr.anonymous) return !map(expr);
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
		if (expr.atomic) return map(expr) || expr;

		var expr2 = ER.substitute0(expr.expr, map);

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
};

ER.substitute1 = function (expr, map) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args.map(arg => ER.substitute0(arg, map));
		return new Rulecall({
			rule, args
		});
	} else if (expr._type == 'yield') {
		var left = expr.left.map(e => ER.substitute0(e, map));
		var right = ER.substitute0(expr.right, map);

		return new Yield({
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

		if (!fun.anonymous)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return ER.expand0Funcalls(ER.substitute0(fun.expr, map));
	} else if (expr._type == 'fun' && expr.anonymous) {
		var expr2 = ER.expand0Funcalls(expr.expr);
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
};

ER.expand0 = function (expr) {
	if (expr._type == 'funcall') {
		var fun = ER.expand0(expr.fun);
		var args = expr.args.map(ER.expand0);

		if (fun._type != 'fun' || fun.atomic)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return ER.expand0(ER.substitute0(fun.expr, map));
	} else if (expr._type == 'fun' && !expr.atomic) {
		var expr2 = ER.expand0(expr.expr);
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
};

// expand0은 하지 않음. rule 단계에서만 풀음.
ER.expand1 = function (expr) {
	if (expr._type == 'rulecall') {
		var rule = expr.rule;
		var args = expr.args;

		var map = param => args[rule.params.indexOf(param)];

		return ER.expand1(ER.substitute1(rule.expr, map));
	} else if (expr._type == 'yield') {
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
	} else if (expr._type == 'yield') {
		var left = expr.left.map(ER.expand0Funcalls);
		var right = ER.expand0Funcalls(expr.right);
		return new Yield({left, right});
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
	} else if (expr._type == 'yield') {
		var left = expr.left.map(ER.expand0);
		var right = ER.expand0(expr.right);
		return new Yield({left, right});
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
		if (!a.type.equals(b.type)) return false;

		if (a._type == 'funcall' && b._type == 'funcall') {
			if (a.fun == b.fun) {
				if (!a.fun.expr) {
					for (let i = 0; i < a.args.length; i++)
						if (!cachedRecurse(a.args[i], b.args[i], depth+1)) return false;
					return true;
				}

				var foo = true;

				for (let i = 0; i < a.args.length; i++) {
					if (!cachedRecurse(
						a.args[i], b.args[i],depth+1
					)) {
						foo = false;
						break;
					}
				}

				if (foo) return true;

				return cachedRecurse(
					ER.expand0FuncallOnce(a),
					ER.expand0FuncallOnce(b),
					depth+1
				);
			}

			if (a.fun._type == 'funcall') {
				return cachedRecurse(
					ER.expand0FuncallOnce(a),
					b,
					depth+1
				);
			}

			if (b.fun._type == 'funcall') {
				return cachedRecurse(
					a,
					ER.expand0FuncallOnce(b),
					depth+1
				);
			}
		
			if (!a.fun.expr && !b.fun.expr) return false;

			var expandA = true;

			if (!a.fun.expr && b.fun.expr)
				expandA = false;

			if (b.fun.anonymous)
				expandA = false;

			if (b.fun.expr && b.fun.expr._type == 'funcall' && b.fun.expr.fun == a.fun)
				expandA = false;

			if (expandA) {
				return cachedRecurse(
					ER.expand0FuncallOnce(a),
					b,
					depth+1
				);
			} else {
				return cachedRecurse(
					a,
					ER.expand0FuncallOnce(b),
					depth+1
				);
			}
		}

		if (b._type == 'funcall')
			[a, b] = [b, a];

		while (a._type == 'funcall') {
			if (!a.fun.expr) return false;
			a = ER.expand0FuncallOnce(a);
		}

		if (a._type == 'typevar' || b._type == 'typevar')
			return a == b;

		// a, b: fun

		var placeholders = Array(a.type.from.length).fill().map((_, i) =>
			new Typevar({
				type: a.type.from[i],
				name: '$' + i
			})
		);

		return cachedRecurse(
			ER.expand0FuncallOnce(new Funcall({
				fun: a,
				args: placeholders
			})),
			ER.expand0FuncallOnce(new Funcall({
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
};

ER.chain = function (yields) {
	return ER.expand1Funcalls(yields.reduceRight((r, l) => {
		for (var i = 0; i < r.left.length; i++) {
			if (ER.equals0(l.right, r.left[i])) {
				var newleft = r.left.slice(0, i)
					.concat(l.left)
					.concat(r.left.slice(i + 1));

				return new Yield({
					left: newleft,
					right: r.right
				});
			}
		}

		throw Error(`Link failed:\n\n${l},\n\n${r}\n`);
	}));
};

module.exports = ER;