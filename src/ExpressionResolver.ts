export type Expr0 = Schemacall | Schema | Typevar;
export type Metaexpr = Tee | Reduction | Schemacall | Schema | $var | Expr0;

function iscall(a: Metaexpr): a is Schemacall {
	return a._type == 'schemacall';
}

function callee(a: Metaexpr) {
	if (iscall(a)) return a.schema;

	console.log(a);
	throw Error();
}

function makecall(a: Metaexpr, args: Expr0[]): Schemacall {
	if (a._type == 'typevar' || a._type == 'schema') {
		return new Schemacall({
			schema: a,
			args
		});
	}

	console.log(a);
	throw Error();
}

export default class ER {
	public static substitute(expr: Metaexpr, map: Map<Typevar | Schema, Expr0>): Metaexpr {
		switch (expr._type) {
			case 'schemacall':
				return new Schemacall({
					schema: ER.substitute(expr.schema, map),
					args: expr.args.map(arg => ER.substitute(arg, map))
				});
			case 'schema':
				if (!expr.expr) return map.get(expr) || expr;

				// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
				if (expr.name) return map.get(expr) || expr;

				// 위의 expr.name 조건을 지우면 특수한 경우에 이게 발생할지도 모른다.
				if (expr.params.some(e => map.has(e)))
					throw Error('Parameter collision');

				return new Schema({
					shouldValidate: expr.shouldValidate,
					axiomatic: expr.axiomatic,
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
			case 'reduction':
				return ER.substitute(expr.reduced, map);
			case '$var':
				return ER.substitute(expr.expr, map);
			default:
				// @ts-ignore
				throw Error(`Unknown type ${expr._type}`);
		}
	}

	public static call(callee: Metaexpr, args: Expr0[]): Metaexpr {
		if (callee._type != 'schema') {
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
	}

	public static expandCallOnce(expr: Metaexpr): Metaexpr {
		if (!iscall(expr)) {
			throw Error('Illegal type');
		}

		if (iscall(callee(expr))) {
			var schema = ER.expandCallOnce(callee(expr));
			return makecall(schema, expr.args);
		}

		var callee_ = callee(expr);

		if (callee_._type != 'schema') {
			throw Error('Something\'s wrong');
		}

		if (!callee_.expr) {
			throw Error('Could not expand');
		}

		return ER.call(callee_, expr.args);
	}

	// expand0은 하지 않는다.
	public static expandMeta(expr: Metaexpr): Metaexpr {
		switch (expr._type) {
			case 'tee':
				var left = expr.left.map(ER.expandMeta);
				var right = ER.expandMeta(expr.right);

				return new Tee({left, right});
			case 'schemacall':
				var schema = ER.expandMeta(expr.schema),
					args = expr.args;
				
				// @ts-ignore
				if (!schema.expr || schema.name && !schema.shouldValidate)
			 		return new Schemacall({schema, args});

				return ER.expandMeta(ER.call(schema, args));
			case 'reduction':
				return ER.expandMeta(expr.reduced);
			case 'schema':
				if (!expr.expr) return expr;
				if (expr.type._type == 'type' && expr.name) return expr;

				return new Schema({
					shouldValidate: expr.shouldValidate,
					axiomatic: expr.axiomatic,
					name: null,
					params: expr.params,
					expr: ER.expandMeta(expr.expr)
				});
			case 'typevar':
				return expr;
			case '$var':
				return ER.expandMeta(expr.expr);
			default:
				console.log(expr);
				throw Error('Unknown metaexpr');
		}
	}

	// expr0의 이름 없는 funcall까지 풀음.
	public static expandMetaAndFuncalls(expr: Metaexpr) {
		switch (expr._type) {
			case 'tee':
				var left = expr.left.map(ER.expandMetaAndFuncalls);
				var right = ER.expandMetaAndFuncalls(expr.right);

				return new Tee({left, right});
			case 'schema':
				if (!expr.expr) return expr;
				if (expr.type._type == 'type' && expr.name) return expr;

				return new Schema({
					shouldValidate: expr.shouldValidate,
					axiomatic: expr.axiomatic,
					name: null,
					params: expr.params,
					expr: ER.expandMetaAndFuncalls(expr.expr)
				});
			case 'schemacall':
				var schema = ER.expandMetaAndFuncalls(expr.schema);
				var args = expr.args.map(ER.expandMetaAndFuncalls);

				if (!schema.expr || schema.name && !schema.shouldValidate)
			 		return new Schemacall({schema, args});

				return ER.expandMetaAndFuncalls(ER.call(schema, args));
			case 'reduction':
				return ER.expandMetaAndFuncalls(expr.reduced);
			case 'typevar':
				return expr;
			case '$var':
				return ER.expandMetaAndFuncalls(expr.expr);
			default:
				console.log(expr);
				throw Error('Unknown metaexpr');
		}
	}

	public static nequalscall = 0;
	public static nequalstrue = 0;
	public static nrecursecall = 0;
	public static nrecursetrue = 0;

	/*
	 * 스펙 참조.
	 */
	public static equals(a: Metaexpr, b: Metaexpr) {
		function recurse(a: Metaexpr, b: Metaexpr, depth: number) {
			if (a == b) return true;

			if (!a.type.equals(b.type)) return false;

			if (a._type == 'reduction') {
				return recurseWrap(a.reduced, b, depth + 1);
			}

			if (b._type == 'reduction') {
				return recurseWrap(a, b.reduced, depth + 1);
			}

			if (a._type == '$var') {
				return recurseWrap(a.expr, b, depth + 1);
			}

			if (b._type == '$var') {
				return recurseWrap(a, b.expr, depth + 1);
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
						return recurseWrap(a.args[i], (b as Schemacall).args[i], depth + 1);
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
				b = b as Tee;

				for (var i = 0; i < a.left.length; i++) {
					if (!recurseWrap(a.left[i], b.left[i], depth + 1)) return false;
				}

				return recurseWrap(a.right, b.right, depth + 1);
			}

			if (a.type.isFunctional) {
				var placeholders = [];
				var len = a.type.resolve().from.length;

				for (var i = 0; i < len; i++) {
					placeholders.push(new Typevar({
						isParam: true,
						type: a.type.resolve().from[i],
						name: '$' + i
					}));
				}

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
	}

	public static chain(tees: Tee[]) {
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
	}
}

// 순환 참조를 피하기 위하여 export 후 import 한다.
import $var from "./nodes/$var";
import Reduction from "./nodes/Reduction";
import Schema from "./nodes/Schema";
import Schemacall from "./nodes/Schemacall";
import Tee from "./nodes/Tee";
import Typevar from "./nodes/Typevar";