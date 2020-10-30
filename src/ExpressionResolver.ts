import $Variable from "./nodes/$Variable";
import Reduction from "./nodes/Reduction";
import Fun from "./nodes/Fun";
import Funcall from "./nodes/Funcall";
import Tee from "./nodes/Tee";
import Variable from "./nodes/Variable";
import ObjectType from "./nodes/ObjectType";
import Metaexpr from "./nodes/Metaexpr";
import Expr0 from "./nodes/Expr0";

function iscall(a: Metaexpr): a is Funcall {
	return a instanceof Funcall;
}

function makecall(a: Metaexpr, args: Expr0[]): Funcall {
	if (a instanceof Variable || a instanceof Fun) {
		return new Funcall({
			fun: a,
			args
		});
	}

	console.log(a);
	throw Error();
}

export default class ExpressionResolver {
	public static substitute(expr: Metaexpr, map: Map<Variable | Fun, Expr0>): Metaexpr {
		if (expr instanceof Funcall) {
			return new Funcall({
				fun: ExpressionResolver.substitute(expr.fun, map),
				// @ts-ignore
				args: expr.args.map(arg => ExpressionResolver.substitute(arg, map))
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
				expr: ExpressionResolver.substitute(expr.expr, map)
			});
		} else if (expr instanceof Variable) {
			return map.get(expr) || expr;
		} else if (expr instanceof Tee) {
			var left = expr.left.map(e => ExpressionResolver.substitute(e, map));
			var right = ExpressionResolver.substitute(expr.right, map);

			return new Tee({
				left, right
			});
		} else if (expr instanceof Reduction) {
			return ExpressionResolver.substitute(expr.reduced, map);
		} else if (expr instanceof $Variable) {
			return ExpressionResolver.substitute(expr.expr, map);
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

		return ExpressionResolver.substitute(callee.expr, map);
	}

	public static expandCallOnce(expr: Metaexpr): Metaexpr {
		if (!iscall(expr)) {
			throw Error('Illegal type');
		}

		if (iscall(expr.fun)) {
			var fun = ExpressionResolver.expandCallOnce(expr.fun);
			return makecall(fun, expr.args);
		}

		var callee_: Metaexpr = expr.fun;

		while (callee_ instanceof $Variable) {
			callee_ = callee_.expr;
		}

		if (!(callee_ instanceof Fun)) {
			throw Error('Something\'s wrong');
		}

		if (!callee_.expr) {
			throw Error('Could not expand');
		}

		return ExpressionResolver.call(callee_, expr.args);
	}

	// expand0은 하지 않는다.
	public static expandMeta(expr: Metaexpr): Metaexpr {
		if (expr instanceof Tee) {
			var left = expr.left.map(ExpressionResolver.expandMeta);
			var right = ExpressionResolver.expandMeta(expr.right);

			return new Tee({left, right});
		} else if (expr instanceof Funcall) {
			var fun = ExpressionResolver.expandMeta(expr.fun),
				args = expr.args;
			
			// @ts-ignore
			if (!fun.expr || fun.name && !fun.isSchema)
				return new Funcall({fun, args});

			return ExpressionResolver.expandMeta(ExpressionResolver.call(fun, args));
		} else if (expr instanceof Reduction) {
			return ExpressionResolver.expandMeta(expr.reduced);
		} else if (expr instanceof Fun) {
			if (!expr.expr) return expr;
			if (expr.type instanceof ObjectType && expr.name) return expr;

			return new Fun({
				isSchema: expr.isSchema,
				annotations: expr.annotations,
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ExpressionResolver.expandMeta(expr.expr)
			});
		} else if (expr instanceof Variable) {
			return expr;
		} else if (expr instanceof $Variable) {
			return ExpressionResolver.expandMeta(expr.expr);
		} else {
			console.log(expr);
			throw Error('Unknown metaexpr');
		}
	}

	// expr0의 이름 없는 funcall까지 풀음.
	public static expandMetaAndFuncalls(expr: Metaexpr) {
		if (expr instanceof Tee) {
			var left = expr.left.map(ExpressionResolver.expandMetaAndFuncalls);
			var right = ExpressionResolver.expandMetaAndFuncalls(expr.right);

			return new Tee({left, right});
		} else if (expr instanceof Fun) {
			if (!expr.expr) return expr;
			if (expr.type instanceof ObjectType && expr.name) return expr;

			return new Fun({
				isSchema: expr.isSchema,
				annotations: expr.annotations,
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				expr: ExpressionResolver.expandMetaAndFuncalls(expr.expr)
			});
		} else if (expr instanceof Funcall) {
			var fun = ExpressionResolver.expandMetaAndFuncalls(expr.fun);
			var args = expr.args.map(ExpressionResolver.expandMetaAndFuncalls);

			if (!fun.expr || fun.name && !fun.isSchema)
				return new Funcall({fun, args});

			return ExpressionResolver.expandMetaAndFuncalls(ExpressionResolver.call(fun, args));
		} else if (expr instanceof Reduction) {
			return ExpressionResolver.expandMetaAndFuncalls(expr.reduced);
		} else if (expr instanceof Variable) {
			return expr;
		} else if (expr instanceof $Variable) {
			return ExpressionResolver.expandMetaAndFuncalls(expr.expr);
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

			if (a instanceof $Variable) {
				return recurseWrap(a.expr, b, depth + 1);
			}

			if (b instanceof $Variable) {
				return recurseWrap(a, b.expr, depth + 1);
			}

			if (iscall(a) && iscall(b)) {
				if (iscall(a.fun)) {
					return recurseWrap(
						ExpressionResolver.expandCallOnce(a), b, depth + 1
					);
				}

				if (iscall(b.fun)) {
					return recurseWrap(
						a, ExpressionResolver.expandCallOnce(b), depth + 1
					);
				}

				var aHasFunExpr = (a.fun instanceof Fun) && a.fun.expr,
					bHasFunExpr = (b.fun instanceof Fun) && b.fun.expr;

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
					return recurseWrap(ExpressionResolver.expandCallOnce(a), b, depth + 1);
				}

				return recurseWrap(a, ExpressionResolver.expandCallOnce(b), depth + 1);
			}

			if (iscall(a)) {
				if (iscall(a.fun)) {
					return recurseWrap(
						ExpressionResolver.expandCallOnce(a), b, depth + 1
					);
				}

				if (!(a.fun instanceof Fun && a.fun.expr)) return false;

				return recurseWrap(
					ExpressionResolver.expandCallOnce(a), b, depth + 1
				);
			}

			if (iscall(b)) {
				if (iscall(b.fun)) {
					return recurseWrap(
						a, ExpressionResolver.expandCallOnce(b), depth + 1
					);
				}

				if (!(b.fun instanceof Fun && b.fun.expr)) return false;

				return recurseWrap(
					a, ExpressionResolver.expandCallOnce(b), depth + 1
				);
			}

			if (a instanceof Tee) {
				if (!(b instanceof Tee)) {
					throw Error('Assertion failed');
				}

				for (var i = 0; i < a.left.length; i++) {
					if (!recurseWrap(a.left[i], b.left[i], depth + 1)) return false;
				}

				return recurseWrap(a.right, b.right, depth + 1);
			}

			if (a.type.isFunctional) {
				var placeholders = [];
				var len = a.type.resolve().from.length;

				for (var i = 0; i < len; i++) {
					placeholders.push(new Variable({
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

		ExpressionResolver.nequalscall++;
		var ret = recurseWrap(a, b, 0);
		if (ret) ExpressionResolver.nequalstrue++;
		return ret;
	}
}