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

ER.substitute = function (expr, map) {
	switch (expr._type) {
		case 'funcall':
			return new Funcall({
				fun: ER.substitute(expr.fun, map),
				args: expr.args.map(arg => ER.substitute(arg, map))
			});
		case 'fun':
			if (!expr.expr) return map(expr) || expr;

			// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
			if (expr.name) return map(expr) || expr;

			// 위의 expr.name 조건을 지우면 특수한 경우에 이게 발생한다.
			if (expr.params.some(e => map(e)))
				throw Error('Parameter collision');

			return new Fun({
				name: null,
				params: expr.params,
				expr: ER.substitute(expr.expr, map)
			});
		case 'typevar':
			return map(expr) || expr;
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
			if (expr.params.some(e => map(e)))
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

ER.call0 = function (fun, args) {
	if (fun._type != 'fun') {
		throw Error('Illegal type');
	}

	if (!fun.expr) {
		throw Error('Cannot call a primitive fun');
	}

	if (fun.params.length != args.length) {
		throw Error('Illegal arguments length');
	}

	var map = param => args[fun.params.indexOf(param)];
	return ER.substitute(fun.expr, map);
};

ER.callMeta = function (schema, args) {
	if (schema._type != 'schema') {
		throw Error('Illegal type');
	}

	if (schema.params.length != args.length) {
		throw Error('Illegal arguments length');
	}

	var map = param => args[schema.params.indexOf(param)];
	return ER.substitute(schema.expr, map);
};

/*
 * 이름 있는 것도 푼다. 한 번만.
 * equals0에서 쓴다.
 */
ER.expand0FuncallOnce = function (expr) {
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

// 이름 있는 것은 풀지 않는다. 재귀적.
ER.expand0Funcalls = function (expr) {
	if (expr._type == 'funcall') {
		var fun = ER.expand0Funcalls(expr.fun);
		var args = expr.args.map(ER.expand0Funcalls);

		if (fun._type != 'fun' || fun.name)
			return new Funcall({fun, args});

		return ER.expand0Funcalls(ER.call0(fun, args));
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

			return ER.expandMeta(ER.callMeta(schema, args));
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

			return ER.expandMetaAndFuncalls(ER.callMeta(schema, args));
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

/*
 * 스펙 참조.
 */
ER.equals0 = function (a, b) {
	function recurse(a, b, depth) {
		if (a == b) return true;

		if (!a.type.equals(b.type)) return false;

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

		return false;
	}

	var recurseWrap = recurse;

	// function recurseWrap(a, b, depth) {
	// 	console.log(`${depth}\n${a}\n\n${b}`);
	// 	var ret = recurse(a, b, depth);
	// 	console.log(`${depth}\n${a}\n\n${b}\n${ret}`);
	// 	return ret;
	// }

	return recurseWrap(a, b, 0);
};

ER.equalsMeta = function (a, b) {
	if (a._type == 'reduction') {
		return ER.equalsMeta(a.reduced, b);
	}

	if (b._type == 'reduction') {
		return ER.equalsMeta(a, b.reduced);
	}

	if (a.type._type == 'type' && b.type._type == 'type') {
		return ER.equals0(a, b);
	}

	return (function recurse(a, b) {
		if (a == b) return true;
		
		if (!a.type.equals(b.type)) return false;

		a = ER.expandMeta(a);
		b = ER.expandMeta(b);

		if (a._type == 'tee') {
			if (b._type != 'tee') {
				throw Error('wut');
			}

			for (var i = 0; i < a.left.length; i++) {
				if (!ER.equals0(a.left[i], b.left[i])) return false;
			}

			return ER.equals0(a.right, b.right);
		}

		if (a._type == 'schema') {
			if (b._type != 'schema' || a.type.from.length != b.type.from.length) {
				throw Error('wut');
			}

			var placeholders = Array(a.type.from.length).fill().map((_, i) =>
				new Typevar({
					type: a.type.from[i],
					name: '$' + i
				})
			);

			return recurse(
				new Schemacall({
					name: null,
					schema: a,
					args: placeholders
				}),
				new Schemacall({
					name: null,
					schema: b,
					args: placeholders
				})
			);
		}

		throw Error('wut');
	})(a, b);
};

ER.chain = function (tees) {
	return ER.expandMetaAndFuncalls(tees.reduceRight((r, l) => {
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