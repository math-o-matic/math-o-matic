var ER = {};

var Type, Typevar, Fun, Funcall, Rule, Tee, Tee2, Rulecall, Ruleset, Link, Linkcall;
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
	Tee2 = o.Tee2;
	Rulecall = o.Rulecall;
	Ruleset = o.Ruleset;
	Link = o.Link;
	Linkcall = o.Linkcall;
};

ER.substitute0 = function (expr, map) {
	if (expr.type.order != 0) {
		throw Error('Illegal order');
	}

	switch (expr._type) {
		case 'funcall':
			return new Funcall({
				fun: ER.substitute0(expr.fun, map),
				args: expr.args.map(arg => ER.substitute0(arg, map))
			});
		case 'fun':
			if (!expr.expr) return map(expr) || expr;

			// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
			if (expr.name) return map(expr) || expr;

			// 위의 expr.name 조건을 지우면 특수한 경우에 이게 발생한다.
			if (expr.params.some(e => map(e)))
				throw Error('Parameter collision');

			return new Fun({
				name: false,
				type: expr.type,
				params: expr.params,
				expr: ER.substitute0(expr.expr, map)
			});
		case 'typevar':
			return map(expr) || expr;
		default:
			throw Error(`Unknown type ${expr._type}`);
	}
};

ER.call0 = function (fun, args) {
	if (fun.type.order != 0) {
		throw Error('Illegal order');
	}

	if (fun._type != 'fun') {
		throw Error('Illegal type');
	}

	if (!fun.expr) {
		throw Error('Cannot call an atomic fun');
	}

	if (fun.params.length != args.length) {
		throw Error('Illegal arguments length');
	}

	var map = param => args[fun.params.indexOf(param)];
	return ER.substitute0(fun.expr, map);
};

/*
 * 네임드도 푼다. 한 번만.
 * equals0에서 쓴다.
 */
ER.expand0FuncallOnce = function (expr) {
	if (expr.type.order != 0) {
		throw Error('Illegal order');
	}

	if (expr._type != 'funcall') {
		throw Error('Illegal type');
	}

	if (expr.fun._type == 'funcall') {
		var fun = ER.expand0FuncallOnce(expr.fun);
		return new Funcall({
			fun,
			args: expr.args
		});
	}

	if (!expr.fun.expr)
		throw Error('Could not expand');

	return ER.call0(expr.fun, expr.args);
};

// 네임드는 안 푼다. 재귀적.
ER.expand0Funcalls = function (expr) {
	if (expr.type.order != 0) {
		throw Error('Illegal order');
	}

	if (expr._type == 'funcall') {
		var fun = ER.expand0Funcalls(expr.fun);
		var args = expr.args.map(ER.expand0Funcalls);

		if (fun._type != 'fun' || fun.name)
			return new Funcall({fun, args});

		return ER.expand0Funcalls(ER.call0(fun, args));
	} else if (expr._type == 'fun' && !expr.name) {
		return new Fun({
			name: false,
			type: expr.type,
			params: expr.params,
			expr: ER.expand0Funcalls(expr.expr)
		});
	} else {
		return expr;
	}
};

ER.expand0 = function (expr) {
	if (expr.type.order != 0) {
		throw Error('Illegal order');
	}

	if (expr._type == 'funcall') {
		var fun = ER.expand0(expr.fun);
		var args = expr.args.map(ER.expand0);

		if (fun._type != 'fun' || !fun.expr)
			return new Funcall({fun, args});

		return ER.expand0(ER.call0(fun, args));
	} else if (expr._type == 'fun' && expr.expr) {
		return new Fun({
			name: false,
			type: expr.type,
			params: expr.params,
			expr: ER.expand0(expr.expr)
		});
	} else {
		return expr;
	}
};

/*
 * 스펙 참조.
 */
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

ER.substitute1 = function (expr, map) {
	if (expr.type.order != 1) {
		throw Error('Illegal order');
	}

	switch (expr._type) {
		case 'tee':
			var left = expr.left.map(e => ER.substitute0(e, map));
			var right = ER.substitute0(expr.right, map);

			return new Tee({
				left, right
			});
		case 'rulecall':
			return new Rulecall({
				rule: ER.substitute1(expr.rule, map),
				args: expr.args.map(arg => ER.substitute0(arg, map))
			});
		case 'rule':
			// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
			if (expr.name) return expr;

			// 위의 expr.name 조건을 지우면 특수한 경우에 이게 발생할지도 모른다.
			if (expr.params.some(e => map(e)))
				throw Error('Parameter collision');

			return new Rule({
				name: false,
				params: expr.params,
				expr: ER.substitute1(expr.expr, map)
			});
		default:
			throw Error(`Unknown type ${expr._type}`);
	}
};

ER.call1 = function (rule, args) {
	if (rule.type.order != 1) {
		throw Error('Illegal order');
	}

	if (rule._type != 'rule') {
		throw Error('Illegal type');
	}

	if (rule.params.length != args.length) {
		throw Error('Illegal arguments length');
	}

	var map = param => args[rule.params.indexOf(param)];
	return ER.substitute1(rule.expr, map);
};

// expand0은 하지 않음. rule 단계에서만 풀음.
ER.expand1 = function (expr) {
	if (expr.type.order != 1) {
		throw Error('Illegal order');
	}

	switch (expr._type) {
		case 'tee':
			return expr;
		case 'rulecall':
			var rule = ER.expand1(expr.rule),
				args = expr.args;

			return ER.expand1(ER.call1(rule, args));
		case 'reduction2':
			return ER.expand1(ER.reduce2(expr));
		case 'rule':
			return new Rule({
				name: '<anonymous>',
				params: expr.params,
				expr: ER.expand1(expr.expr)
			});
		default:
			console.error(expr);
			throw Error('Unknown expr1');
	}
};

// expr0의 funcall까지 풀음.
ER.expand1Funcalls = function (expr) {
	if (expr.type.order != 1) {
		throw Error('Illegal order');
	}

	switch (expr._type) {
		case 'tee':
			var left = expr.left.map(ER.expand0Funcalls);
			var right = ER.expand0Funcalls(expr.right);

			return new Tee({left, right});
		case 'rulecall':
			var rule = ER.expand1Funcalls(expr.rule);
			var args = expr.args.map(ER.expand0Funcalls);

			return ER.expand1Funcalls(ER.call1(rule, args));
		case 'reduction2':
			throw Error('Not implemented');
		case 'rule':
			return new Rule({
				name: '<anonymous>',
				params: expr.params,
				expr: ER.expand1Funcalls(expr.expr)
			});
		default:
			throw Error('Unknown expr1');
	}
};

// expr0까지 최대로 풀음.
ER.expand1Full = function (expr) {
	if (expr.type.order != 1) {
		throw Error('Illegal order');
	}

	switch (expr._type) {
		case 'tee':
			var left = expr.left.map(ER.expand0);
			var right = ER.expand0(expr.right);

			return new Tee({left, right});
		case 'rulecall':
			var rule = ER.expand1Full(expr.rule);
			var args = expr.args.map(ER.expand0);

			return ER.expand1Full(ER.call1(rule, args));
		case 'reduction2':
			throw Error('Not implemented');
		case 'rule':
			return new Rule({
				name: '<anonymous>',
				params: expr.params,
				expr: ER.expand1Full(expr.expr)
			});
		default:
			throw Error('Unknown expr1');
	}
};

ER.equals1 = function (a, b) {
	return (function recurse(a, b) {
		if (a.type.order != 1 || b.type.order != 1) {
			throw Error('Illegal order');
		}

		if (!a.type.equals(b.type)) return false;

		a = ER.expand1(a);
		b = ER.expand1(b);

		console.log(a, b);

		if (a._type == 'tee') {
			if (b._type != 'tee') {
				throw Error('wut');
			}

			for (var i = 0; i < a.left.length; i++) {
				if (!ER.equals0(a.left[i], b.left[i])) return false;
			}

			return ER.equals0(a.right, b.right);
		}

		if (a._type == 'rule') {
			if (b._type != 'rule' || a.type.from.length != b.type.from.length) {
				throw Error('wut');
			}

			var placeholders = Array(a.type.from.length).fill().map((_, i) =>
				new Typevar({
					type: a.type.from[i],
					name: '$' + i
				})
			);

			return recurse(
				new Rulecall({
					name: '<anonymous>',
					rule: a,
					args: placeholders
				}),
				new Rulecall({
					name: '<anonymous>',
					rule: b,
					args: placeholders
				})
			);
		}

		throw Error('wut');
	})(a, b);
};

ER.reduce2 = function (expr) {
	if (expr.type.order != 1) {
		throw Error('Illegal order');
	}

	if (expr._type != 'reduction2') {
		throw Error('Illegal type');
	}

	var tee2 = ER.expand2(expr.expr2);

	if (tee2._type != 'tee2') {
		throw Error('no');
	}

	var left = tee2.left;
	var args = expr.args;

	if (left.length != args.length) {
		throw Error('Illegal argument length');
	}

	for (var i = 0; i < left.length; i++) {
		if (!ER.equals1(left[i], args[i])) {
			console.error(left[i], args[i]);
			throw Error(`Argument matching failed (expected ${left[i]}): ${ER.expand1(args[i])}`);
		}
	}

	return tee2.right;
};

ER.substitute2 = function (expr, map) {
	if (expr.type.order != 2) {
		throw Error('Illegal order');
	}

	switch (expr._type) {
		case 'tee2':
			var left = expr.left.map(e => ER.substitute1(e, map));
			var right = ER.substitute1(expr.right, map);

			return new Tee2({
				left, right
			});
		case 'linkcall':
			// 링크는 익명 표현법이 없으므로 링크 본체에 있는 것은 치환할 필요가 없다는 가정이 들어 있다.
			var link = expr.link;
			var args = expr.args.map(arg => ER.substitute0(arg, map));

			return new Linkcall({
				link, args
			});
		default:
			throw Error(`Unknown type ${expr._type}`);
	}
};

ER.call2 = function (link, args) {
	if (link.type.order != 2) {
		throw Error('Illegal order');
	}

	if (link._type != 'link') {
		throw Error('Illegal type');
	}

	if (link.params.length != args.length) {
		throw Error('Illegal arguments length');
	}

	var map = param => args[link.params.indexOf(param)];
	return ER.substitute2(link.expr, map);
};

/*
 * 2계층에서만 최대로 푼다.
 */
ER.expand2 = function (expr) {
	if (expr.type.order != 2) {
		throw Error('Illegal order');
	}

	switch (expr._type) {
		case 'tee2':
			return expr;
		case 'linkcall':
			var link = expr.link,
				args = expr.args.map(ER.expand0);

			return ER.expand2(ER.call2(link, args));
		case 'link':
			return new Link({
				name: '<anonymous>',
				params: expr.params,
				expr: ER.expand2(expr.expr)
			});
		default:
			throw Error('Unknown expr2');
	}
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