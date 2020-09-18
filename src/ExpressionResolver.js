var ER = {};

var Type, Typevar, Fun, Funcall, Tee, Ruleset, Schema, Schemacall;
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
	Tee = o.Tee;
	Ruleset = o.Ruleset;
	Schema = o.Schema;
	Schemacall = o.Schemacall;
};

function iscallable(a) {
	return ['schema', 'fun'].includes(a._type);
}

function iscall(a) {
	return ['schemacall', 'funcall'].includes(a._type);
}

function callee(a) {
	return a._type == 'schemacall'
		? a.schema
		: a._type == 'funcall'
			? a.fun
			: (() => {
				console.log(a);
				throw Error();
			})();
}

function makecall(a, args) {
	return a._type == 'fun' || a._type == 'typevar'
		? new Funcall({
			fun: a,
			args
		})
		: a._type == 'schema'
			? new Schemacall({
				schema: a,
				args
			})
			: (() => {
				console.log(a);
				throw Error();
			})();
}

ER.substitute = function (expr, map) {
	switch (expr._type) {
		case 'funcall':
			var fun = ER.substitute(expr.fun, map),
				args = expr.args.map(arg => ER.substitute(arg, map));

			if (fun._type == 'schema') {
				return new Schemacall({
					schema: fun,
					args
				});
			}

			return new Funcall({ fun, args });
		case 'fun':
			if (!expr.expr) return map.get(expr) || expr;

			// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
			if (expr.name) return map.get(expr) || expr;

			// 위의 expr.name 조건을 지우면 특수한 경우에 이게 발생한다.
			if (expr.params.some(e => map.has(e)))
				throw Error('Parameter collision');

			return new Fun({
				name: null,
				params: expr.params,
				expr: ER.substitute(expr.expr, map)
			});
		case 'typevar':
			return map.get(expr) || expr;
		case 'tee':
			var left = expr.left.map(e => ER.substitute(e, map));
			var right = ER.substitute(expr.right, map);

			return new Tee({
				left, right
			});
		case 'schemacall':
			return new Schemacall({
				schema: ER.substitute(expr.schema, map),
				args: expr.args.map(arg => ER.substitute(arg, map))
			});
		case 'schema':
			// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
			if (expr.name) return expr;

			// 위의 expr.name 조건을 지우면 특수한 경우에 이게 발생할지도 모른다.
			if (expr.params.some(e => map.has(e)))
				throw Error('Parameter collision');

			return new Schema({
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ER.substitute(expr.expr, map)
			});
		case 'reduction':
			return ER.substitute(expr.reduced, map);
		default:
			throw Error(`Unknown type ${expr._type}`);
	}
};

ER.call = function (callee, args) {
	if (!iscallable(callee)) {
		console.log(callee);
		throw Error('Illegal type');
	}

	if (!callee.expr) {
		throw Error('Cannot call a callable without a body');
	}

	if (callee.params.length != args.length) {
		throw Error('Illegal arguments length');
	}

	var map = new Map();

	for (var i = 0; i < callee.params.length; i++) {
		map.set(callee.params[i], args[i]);
	}

	return ER.substitute(callee.expr, map);
};

ER.expandCallOnce = function (expr) {
	if (!iscall(expr)) {
		throw Error('Illegal type');
	}

	if (iscall(callee(expr))) {
		var fun = ER.expandCallOnce(callee(expr));
		return makecall(fun, expr.args);
	}

	if (!callee(expr).expr) {
		throw Error('Could not expand');
	}

	return ER.call(callee(expr), expr.args);
};

// 이름 있는 것은 풀지 않는다. 재귀적.
ER.expand0Funcalls = function (expr) {
	if (expr._type == 'funcall') {
		var fun = ER.expand0Funcalls(expr.fun);
		var args = expr.args.map(ER.expand0Funcalls);

		if (fun._type != 'fun' || fun.name)
			return new Funcall({fun, args});

		return ER.expand0Funcalls(ER.call(fun, args));
	} else if (expr._type == 'fun' && !expr.name) {
		return new Fun({
			name: null,
			params: expr.params,
			expr: ER.expand0Funcalls(expr.expr)
		});
	} else {
		return expr;
	}
};

// expand0은 하지 않는다.
ER.expandMeta = function (expr) {
	if (expr.native) {
		return expr;
	}

	switch (expr._type) {
		case 'tee':
			var left = expr.left.map(ER.expandMeta);
			var right = ER.expandMeta(expr.right);

			return new Tee({left, right});
		case 'schemacall':
			var schema = ER.expandMeta(expr.schema),
				args = expr.args;

			return ER.expandMeta(ER.call(schema, args));
		case 'reduction':
			return ER.expandMeta(expr.reduced);
		case 'schema':
			return new Schema({
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ER.expandMeta(expr.expr)
			});
		case 'funcall':
		case 'fun':
		case 'typevar':
			return expr;
		default:
			console.log(expr);
			throw Error('Unknown metaexpr');
	}
};

// expr0의 이름 없는 funcall까지 풀음.
ER.expandMetaAndFuncalls = function (expr) {
	switch (expr._type) {
		case 'tee':
			var left = expr.left.map(ER.expandMetaAndFuncalls);
			var right = ER.expandMetaAndFuncalls(expr.right);

			return new Tee({left, right});
		case 'schemacall':
			var schema = ER.expandMetaAndFuncalls(expr.schema);
			var args = expr.args.map(ER.expand0Funcalls);

			return ER.expandMetaAndFuncalls(ER.call(schema, args));
		case 'reduction':
			return ER.expandMetaAndFuncalls(expr.reduced);
		case 'schema':
			return new Schema({
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ER.expandMetaAndFuncalls(expr.expr)
			});
		case 'funcall':
		case 'fun':
		case 'typevar':
			return ER.expand0Funcalls(expr);
		default:
			console.log(expr);
			throw Error('Unknown metaexpr');
	}
};

ER.nequalscall = ER.nequalstrue = ER.nrecursecall = ER.nrecursetrue = 0;

/*
 * 스펙 참조.
 */
ER.equals = function (a, b) {
	function recurse(a, b, depth) {
		if (a == b) return true;

		if (!a.type.equals(b.type)) return false;

		if (a._type == 'reduction') {
			return recurseWrap(a.reduced, b, depth + 1);
		}

		if (b._type == 'reduction') {
			return recurseWrap(a, b.reduced, depth + 1);
		}

		if (iscall(a) && iscall(b)) {
			if (iscall(callee(a))) {
				return recurseWrap(
					ER.expandCallOnce(a), b, depth + 1
				);
			}

			if (iscall(callee(b))) {
				return recurseWrap(
					a, ER.expandCallOnce(b), depth + 1
				);
			}

			if (callee(a) == callee(b) || !callee(a).expr && !callee(b).expr) {
				if (callee(a) != callee(b)) return false;

				if (!callee(a).expr && !callee(b).expr) {
					for (var i = 0; i < a.args.length; i++) {
						if (!recurseWrap(a.args[i], b.args[i], depth + 1)) return false;
					}

					return true;
				}

				if (a.args.every((_, i) => {
					return recurseWrap(a.args[i], b.args[i], depth + 1);
				})) {
					return true;
				}
			}

			if (callee(a).expr) {
				return recurseWrap(ER.expandCallOnce(a), b, depth + 1);
			}

			return recurseWrap(a, ER.expandCallOnce(b), depth + 1);
		}

		if (iscall(a)) {
			if (iscall(callee(a))) {
				return recurseWrap(
					ER.expandCallOnce(a), b, depth + 1
				);
			}

			if (!callee(a).expr) return false;

			return recurseWrap(
				ER.expandCallOnce(a), b, depth + 1
			);
		}

		if (iscall(b)) {
			if (iscall(callee(b))) {
				return recurseWrap(
					a, ER.expandCallOnce(b), depth + 1
				);
			}

			if (!callee(b).expr) return false;

			return recurseWrap(
				a, ER.expandCallOnce(b), depth + 1
			);
		}

		if (a._type == 'tee') {
			for (var i = 0; i < a.left.length; i++) {
				if (!recurseWrap(a.left[i], b.left[i], depth + 1)) return false;
			}

			return recurseWrap(a.right, b.right, depth + 1);
		}

		if (a.type.isFunctional) {
			var placeholders = Array(a.type.resolve().from.length).fill().map((_, i) =>
				new Typevar({
					type: a.type.resolve().from[i],
					name: '$' + i
				})
			);

			return recurseWrap(
				makecall(a, placeholders), makecall(b, placeholders), depth + 1
			);
		}

		return false;
	}

	var recurseWrap = recurse;

	// function recurseWrap(a, b, depth) {
	// 	ER.nrecursecall++;

	// 	console.log(`depth ${depth}\n${a}\n\n${b}`);
	// 	var ret = recurse(a, b, depth);
	// 	console.log(`depth ${depth} → ${ret}`);

	// 	if (ret) ER.nrecursetrue++;

	// 	return ret;
	// }

	ER.nequalscall++;
	var ret = recurseWrap(a, b, 0);
	if (ret) ER.nequalstrue++;
	return ret;
};

ER.chain = function (tees) {
	if (!tees.every(tee => tee._type == 'tee')) {
		throw Error('no');
	}

	return ER.expandMetaAndFuncalls(tees.reduceRight((r, l) => {
		for (var i = 0; i < r.left.length; i++) {
			if (ER.equals(l.right, r.left[i])) {
				var newleft = r.left.slice(0, i)
					.concat(l.left)
					.concat(r.left.slice(i + 1));

				return new Tee({
					left: newleft,
					right: r.right
				});
			}
		}

		throw Error(`Chaining failed:

--- LEFT ---
${l}
------------

--- RIGHT ---
${r}
-------------`);
	}));
};

module.exports = ER;