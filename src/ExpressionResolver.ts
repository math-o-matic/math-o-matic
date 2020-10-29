export type Expr0 = Funcall | Fun | Typevar;
export type Metaexpr = Tee | Reduction | Funcall | Fun | $var | Expr0;

function iscall(a: Metaexpr): a is Funcall {
	return a instanceof Funcall;
}

function makecall(a: Metaexpr, args: Expr0[]): Funcall {
	if (a instanceof Typevar || a instanceof Fun) {
		return new Funcall({
			fun: a,
			args
		});
	}

	console.log(a);
	throw Error();
}

export default class ER {
	public static substitute(expr: Metaexpr, map: Map<Typevar | Fun, Expr0>): Metaexpr {
		if (expr instanceof Funcall) {
			return new Funcall({
				fun: ER.substitute(expr.fun, map),
				// @ts-ignore
				args: expr.args.map(arg => ER.substitute(arg, map))
			});
		} else if (expr instanceof Fun) {
			if (!expr.expr) return expr;

			// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
			if (expr.name) return expr;

			// 위의 expr.name 조건을 지우면 특수한 경우에 이게 발생할지도 모른다.
			if (expr.params.some(e => map.has(e)))
				throw Error('Parameter collision');

			return new Fun({
				isSchema: expr.isSchema,
				annotations: expr.annotations,
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ER.substitute(expr.expr, map)
			});
		} else if (expr instanceof Typevar) {
			return map.get(expr) || expr;
		} else if (expr instanceof Tee) {
			var left = expr.left.map(e => ER.substitute(e, map));
			var right = ER.substitute(expr.right, map);

			return new Tee({
				left, right
			});
		} else if (expr instanceof Reduction) {
			return ER.substitute(expr.reduced, map);
		} else if (expr instanceof $var) {
			return ER.substitute(expr.expr, map);
		} else {
			console.log(expr);
			throw Error('Unknown metaexpr');
		}
	}

	public static call(callee: Metaexpr, args: Expr0[]): Metaexpr {
		if (!(callee instanceof Fun)) {
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

		if (iscall(expr.fun)) {
			var fun = ER.expandCallOnce(expr.fun);
			return makecall(fun, expr.args);
		}

		var callee_: Metaexpr = expr.fun;

		while (callee_ instanceof $var) {
			callee_ = callee_.expr;
		}

		if (!(callee_ instanceof Fun)) {
			throw Error('Something\'s wrong');
		}

		if (!callee_.expr) {
			throw Error('Could not expand');
		}

		return ER.call(callee_, expr.args);
	}

	// expand0은 하지 않는다.
	public static expandMeta(expr: Metaexpr): Metaexpr {
		if (expr instanceof Tee) {
			var left = expr.left.map(ER.expandMeta);
			var right = ER.expandMeta(expr.right);

			return new Tee({left, right});
		} else if (expr instanceof Funcall) {
			var fun = ER.expandMeta(expr.fun),
				args = expr.args;
			
			// @ts-ignore
			if (!fun.expr || fun.name && !fun.shouldValidate)
				return new Funcall({fun, args});

			return ER.expandMeta(ER.call(fun, args));
		} else if (expr instanceof Reduction) {
			return ER.expandMeta(expr.reduced);
		} else if (expr instanceof Fun) {
			if (!expr.expr) return expr;
			if (expr.type instanceof Type && expr.name) return expr;

			return new Fun({
				isSchema: expr.isSchema,
				annotations: expr.annotations,
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ER.expandMeta(expr.expr)
			});
		} else if (expr instanceof Typevar) {
			return expr;
		} else if (expr instanceof $var) {
			return ER.expandMeta(expr.expr);
		} else {
			console.log(expr);
			throw Error('Unknown metaexpr');
		}
	}

	// expr0의 이름 없는 funcall까지 풀음.
	public static expandMetaAndFuncalls(expr: Metaexpr) {
		if (expr instanceof Tee) {
			var left = expr.left.map(ER.expandMetaAndFuncalls);
			var right = ER.expandMetaAndFuncalls(expr.right);

			return new Tee({left, right});
		} else if (expr instanceof Fun) {
			if (!expr.expr) return expr;
			if (expr.type instanceof Type && expr.name) return expr;

			return new Fun({
				isSchema: expr.isSchema,
				annotations: expr.annotations,
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ER.expandMetaAndFuncalls(expr.expr)
			});
		} else if (expr instanceof Funcall) {
			var fun = ER.expandMetaAndFuncalls(expr.fun);
			var args = expr.args.map(ER.expandMetaAndFuncalls);

			if (!fun.expr || fun.name && !fun.shouldValidate)
				return new Funcall({fun, args});

			return ER.expandMetaAndFuncalls(ER.call(fun, args));
		} else if (expr instanceof Reduction) {
			return ER.expandMetaAndFuncalls(expr.reduced);
		} else if (expr instanceof Typevar) {
			return expr;
		} else if (expr instanceof $var) {
			return ER.expandMetaAndFuncalls(expr.expr);
		} else {
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

			if (a instanceof Reduction) {
				return recurseWrap(a.reduced, b, depth + 1);
			}

			if (b instanceof Reduction) {
				return recurseWrap(a, b.reduced, depth + 1);
			}

			if (a instanceof $var) {
				return recurseWrap(a.expr, b, depth + 1);
			}

			if (b instanceof $var) {
				return recurseWrap(a, b.expr, depth + 1);
			}

			if (iscall(a) && iscall(b)) {
				if (iscall(a.fun)) {
					return recurseWrap(
						ER.expandCallOnce(a), b, depth + 1
					);
				}

				if (iscall(b.fun)) {
					return recurseWrap(
						a, ER.expandCallOnce(b), depth + 1
					);
				}

				var aHasFunExpr = 'expr' in a.fun && a.fun.expr,
					bHasFunExpr = 'expr' in b.fun && b.fun.expr;

				if (a.fun == b.fun || !aHasFunExpr && !bHasFunExpr) {
					if (a.fun != b.fun) return false;

					if (!aHasFunExpr && !bHasFunExpr) {
						for (var i = 0; i < a.args.length; i++) {
							if (!recurseWrap(a.args[i], b.args[i], depth + 1)) return false;
						}

						return true;
					}

					if (a.args.every((_, i) => {
						return recurseWrap(a.args[i], (b as Funcall).args[i], depth + 1);
					})) {
						return true;
					}
				}

				if (aHasFunExpr) {
					return recurseWrap(ER.expandCallOnce(a), b, depth + 1);
				}

				return recurseWrap(a, ER.expandCallOnce(b), depth + 1);
			}

			if (iscall(a)) {
				if (iscall(a.fun)) {
					return recurseWrap(
						ER.expandCallOnce(a), b, depth + 1
					);
				}

				if (!('expr' in a.fun && a.fun.expr)) return false;

				return recurseWrap(
					ER.expandCallOnce(a), b, depth + 1
				);
			}

			if (iscall(b)) {
				if (iscall(b.fun)) {
					return recurseWrap(
						a, ER.expandCallOnce(b), depth + 1
					);
				}

				if (!('expr' in b.fun && b.fun.expr)) return false;

				return recurseWrap(
					a, ER.expandCallOnce(b), depth + 1
				);
			}

			if (a instanceof Tee) {
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
}

// 순환 참조를 피하기 위하여 export 후 import 한다.
import $var from "./nodes/$var";
import Reduction from "./nodes/Reduction";
import Fun from "./nodes/Fun";
import Funcall from "./nodes/Funcall";
import Tee from "./nodes/Tee";
import Typevar from "./nodes/Typevar";
import Type from "./nodes/Type";
