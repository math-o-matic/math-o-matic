import $Variable from "./nodes/$Variable";
import Reduction from "./nodes/Reduction";
import ObjectFun from "./nodes/ObjectFun";
import Schema from "./nodes/Schema";
import Fun from "./nodes/Fun";
import Funcall from "./nodes/Funcall";
import Tee from "./nodes/Tee";
import Variable from "./nodes/Variable";
import ObjectType from "./nodes/ObjectType";
import Metaexpr from "./nodes/Metaexpr";
import MetaType from "./nodes/MetaType";

export default class ExpressionResolver {

	/* public static expandCallOnce(expr: Funcall): Metaexpr {
		if (!(expr instanceof Funcall)) {
			throw Error('Illegal type');
		}

		if (expr.fun instanceof Funcall) {
			var fun = ExpressionResolver.expandCallOnce(expr.fun);
			return new Funcall({
				fun,
				args: expr.args
			});
		}

		var callee: Metaexpr = expr.fun;

		while (callee instanceof $Variable) {
			callee = callee.expr;
		}

		if (!(callee instanceof Fun)) {
			throw Error('Something\'s wrong');
		}

		if (!callee.expr) {
			throw Error('Could not expand');
		}

		return callee.call(expr.args);
	} */

	// expand0은 하지 않는다.
	public static expandMeta(expr: Metaexpr): Metaexpr {
		if (expr instanceof Tee) {
			var left = expr.left.map(ExpressionResolver.expandMeta);
			var right = ExpressionResolver.expandMeta(expr.right);

			return new Tee({left, right});
		} else if (expr instanceof Funcall) {
			var fun = ExpressionResolver.expandMeta(expr.fun),
				args = expr.args;
			
			if (!(fun instanceof Fun) || !fun.expr || fun.name && !(fun instanceof Schema))
				return new Funcall({fun, args});

			return ExpressionResolver.expandMeta(fun.call(args));
		} else if (expr instanceof Reduction) {
			return ExpressionResolver.expandMeta(expr.reduced);
		} else if (expr instanceof ObjectFun) {
			if (!expr.expr) return expr;
			if (expr.type instanceof ObjectType && expr.name) return expr;

			return new ObjectFun({
				annotations: expr.annotations,
				name: null,
				params: expr.params,
				expr: ExpressionResolver.expandMeta(expr.expr)
			});
		} else if (expr instanceof Schema) {
			if (!expr.expr) return expr;
			if (expr.type instanceof ObjectType && expr.name) return expr;

			return new Schema({
				annotations: expr.annotations,
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				def$s: expr.def$s,
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
	public static expandMetaAndFuncalls(expr: Metaexpr): Metaexpr {
		if (expr instanceof Tee) {
			var left = expr.left.map(ExpressionResolver.expandMetaAndFuncalls);
			var right = ExpressionResolver.expandMetaAndFuncalls(expr.right);

			return new Tee({left, right});
		} else if (expr instanceof ObjectFun) {
			if (!expr.expr) return expr;
			if (expr.type instanceof ObjectType && expr.name) return expr;

			return new ObjectFun({
				annotations: expr.annotations,
				name: null,
				params: expr.params,
				expr: ExpressionResolver.expandMetaAndFuncalls(expr.expr)
			});
		} else if (expr instanceof Schema) {
			if (!expr.expr) return expr;
			if (expr.type instanceof ObjectType && expr.name) return expr;

			return new Schema({
				annotations: expr.annotations,
				axiomatic: expr.axiomatic,
				name: null,
				params: expr.params,
				def$s: expr.def$s,
				expr: ExpressionResolver.expandMetaAndFuncalls(expr.expr)
			});
		} else if (expr instanceof Funcall) {
			var fun = ExpressionResolver.expandMetaAndFuncalls(expr.fun);
			var args = expr.args.map(ExpressionResolver.expandMetaAndFuncalls);

			if (!(fun instanceof Fun) || !fun.expr || fun.name && !(fun instanceof Schema))
				return new Funcall({fun, args});

			return ExpressionResolver.expandMetaAndFuncalls(fun.call(args));
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

			if (a instanceof Funcall && b instanceof Funcall) {
				if (a.fun instanceof Funcall) {
					return recurseWrap(
						a.expandOnce(), b, depth + 1
					);
				}

				if (b.fun instanceof Funcall) {
					return recurseWrap(
						a, b.expandOnce(), depth + 1
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
					return recurseWrap(a.expandOnce(), b, depth + 1);
				}

				return recurseWrap(a, b.expandOnce(), depth + 1);
			}

			if (a instanceof Funcall) {
				if (a.fun instanceof Funcall) {
					return recurseWrap(
						a.expandOnce(), b, depth + 1
					);
				}

				if (!(a.fun instanceof Fun && a.fun.expr)) return false;

				return recurseWrap(
					a.expandOnce(), b, depth + 1
				);
			}

			if (b instanceof Funcall) {
				if (b.fun instanceof Funcall) {
					return recurseWrap(
						a, b.expandOnce(), depth + 1
					);
				}

				if (!(b.fun instanceof Fun && b.fun.expr)) return false;

				return recurseWrap(
					a, b.expandOnce(), depth + 1
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
				var len = (a.type.resolve() as ObjectType | MetaType).from.length;

				for (var i = 0; i < len; i++) {
					placeholders.push(new Variable({
						isParam: true,
						type: (a.type.resolve() as ObjectType | MetaType).from[i],
						name: '$' + i
					}));
				}

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