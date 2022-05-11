/**
 * 숫자가 큰 것이 우선순위가 높다.
 */
 enum EqualsPriority {
	/** Variable (primitive) */
	ZERO,
	/** Fun */
	ONE,
	/** Conditional */
	TWO,
	/** Funcall */
	THREE,
	/** Variable (macro) */
	FOUR,
	/** $Variable, Reduction */
	FIVE
}

export default class Calculus {
	/**
	 * 표현식에 대해 capture-avoiding substitution
	 * (https://en.wikipedia.org/wiki/Lambda_calculus#Capture-avoiding_substitutions)
	 * 을 수행한다. 변수 `x1, ... xn` (서로 다름) 및 표현식 `r1, ..., rn`에 대해
	 * `x = <x1, ..., xn>, r = <r1, ..., rn>`이라 하였을 때 `E[x := r]`는
	 * 표현식 `E`에서 `xi`를 `ri`로 치환한 것이고 이는 다음과 같이 정의된다.
	 * 
	 *  * `a[x := r] = (ri if xi = a, a otherwise)`,
	 *  * `f(a, ..., b) = (f[x := r])(a[x := r], ..., b[x := r])`,
	 *  * `((a, ..., b) => E)[x := r] = (a, ..., b) => E[y := s]`,
	 * 
	 *    단 `y`는 `x`에서 `a, ..., b`를 뺀 것이고 `si`는 `yi = xj`일 때 `rj`이다.
	 *  * `(A, ..., B |- C)[x := r] = A[x := r], ..., B[x := r] |- C[x := r]`.
	 * 
	 * 치환되는 것은 변항이며 매크로이거나 정항이어도 된다.
	 * @param map `xi`를 `ri`에 대응시키는 매핑.
	 */
	public static substitute(self: Expr, map: Map<Variable, Expr>): Expr {
		if (self instanceof Variable) {
			if (map.has(self)) return map.get(self);

			// 매크로 변수는 스코프 밖에서 보이지 않으므로 치환될 것을 갖지 않는다는
			// 생각이 들어 있다.
			if (self.expr) {
				return self;
			}

			return self;
		}
		
		if (self instanceof $Variable) {
			var expr = Calculus.substitute(self.expr, map);
			if (expr == self.expr) return self;
			return expr;
		}

		if (self instanceof ObjectFun || self instanceof Schema) {
			if (!self.expr) return self;

			// 이름이 있는 것은 치환될 것을 갖지 않아야 한다.
			if (self.name) return self;
	
			if (self.params.some(p => map.has(p))) {
				map = new Map(map);
	
				// (λx.t)[x := r] = λx.t
				self.params.forEach(p => {
					if (map.has(p)) {
						map.delete(p);
					}
				});
			}
	
			var expr = Calculus.substitute(self.expr, map);
			if (expr == self.expr) return self;

			if (self instanceof Schema) {
				return new Schema({
					doc: null,
					tex: null,
					schemaType: 'schema',
					name: null,
					params: self.params,
					context: self.context,
					def$s: self.def$s,
					expr
				}, self.trace);
			}
	
			return new ObjectFun({
				doc: null,
				precedence: Precedence.ZERO,
				tex: null,
				sealed: self.sealed,
				rettype: null,
				name: null,
				params: self.params,
				expr
			}, self.trace);
		}

		if (self instanceof Funcall) {
			var fun = Calculus.substitute(self.fun, map),
				args = self.args.map(arg => Calculus.substitute(arg, map));
			
			if (fun == self.fun && args.every((arg, i) => arg == self.args[i]))
				return self;

			return new Funcall({fun, args}, self.trace);
		}

		if (self instanceof Conditional) {
			var left = self.left.map(e => Calculus.substitute(e, map));
			var right = Calculus.substitute(self.right, map);
	
			if (left.every((l, i) => l == self.left[i]) && right == self.right) return self;
	
			return new Conditional({left, def$s: null, right}, self.trace);
		}

		if (self instanceof Reduction) {
			return Calculus.substitute(self.consequent, map);
		}

		if (self instanceof With) {
			if (map.has(self.variable)) {
				map = new Map(map);
				map.delete(self.variable);
			}
	
			return Calculus.substitute(Calculus.expand(self), map);
		}

		throw Error('Unknown expression type');
	}

	private static expandCache: Map<Expr, Expr> = new Map();

	public static expand(self: Expr): Expr {
		if (Calculus.expandCache.has(self)) return Calculus.expandCache.get(self);
		var ret = Calculus.expandInternal(self);
		Calculus.expandCache.set(self, ret);
		return ret;
	}

	protected static expandInternal(self: Expr): Expr {
		if (self instanceof $Variable) {
			var expr = Calculus.expand(self.expr);
			if (expr == self.expr) return self;
			return expr;
		}

		if (self instanceof Conditional) {
			var left = self.left.map(lef => Calculus.expand(lef));
			var right = Calculus.expand(self.right);

			if (left.every((l, i) => l == self.left[i]) && right == self.right) return self;

			return new Conditional({left, def$s: null, right}, self.trace);
		}

		if (self instanceof Funcall) {
			var fun = Calculus.expand(self.fun),
				args = self.args.map(arg => Calculus.expand(arg));
			
			if (!(fun instanceof Fun) || !fun.expr || fun.name && !(fun instanceof Schema)) {
				if (fun == self.fun && args.every((arg, i) => arg == self.args[i])) return self;
				
				return new Funcall({fun, args}, self.trace);
			}

			return Calculus.expand(fun.call(args));
		}

		if (self instanceof ObjectFun) {
			if (!self.expr) return self;
			if (self.name) return self;

			var expr = Calculus.expand(self.expr);
			if (expr == self.expr) return self;

			return new ObjectFun({
				doc: null,
				precedence: Precedence.ZERO,
				tex: null,
				sealed: self.sealed,
				rettype: null,
				name: null,
				params: self.params,
				expr
			}, self.trace);
		}

		if (self instanceof Reduction) {
			return Calculus.expand(self.consequent);
		}

		if (self instanceof Schema) {
			var expr = Calculus.expand(self.expr);
			if (expr == self.expr) return self;
			
			return new Schema({
				doc: null,
				tex: null,
				schemaType: 'schema',
				name: null,
				params: self.params,
				context: self.context,
				def$s: self.def$s,
				expr: Calculus.expand(self.expr)
			}, self.trace);
		}

		if (self instanceof Variable) {
			return self;
		}

		if (self instanceof With) {
			var map = new Map<Variable, Expr>();
			map.set(self.variable, self.variable.expr);

			return Calculus.expand(Calculus.substitute(self.expr, map));
		}

		throw Error('Unknown expression type');
	}

	public static getEqualsPriority(self: Expr, context: ExecutionContext): EqualsPriority {
		if (self instanceof Variable) {
			return self.expr && (!self.sealed || context.canUse(self))
				? EqualsPriority.FOUR
				: EqualsPriority.ZERO;
		}

		if (self instanceof Fun) {
			return EqualsPriority.ONE;
		}

		if (self instanceof Conditional) {
			return EqualsPriority.TWO;
		}

		if (self instanceof Funcall) {
			return EqualsPriority.THREE;
		}

		if (self instanceof Reduction || self instanceof $Variable) {
			return EqualsPriority.FIVE;
		}

		if (self instanceof With) {
			throw new Error("Method not implemented.");
		}

		throw Error('Unknown expression type');
	}

	/**
	 * 
	 * @return 같지 않으면 `false`. 같으면 같음을 보이는 데 사용한 매크로들의 목록.
	 */
	public static equals(self: Expr, obj: Expr, context: ExecutionContext): (Fun | Variable)[] | false {
		// console.log(`${self}\n\n${obj}`);
		// var ret = (() => {
		
		if (self === obj) return [];
		if (!self.type.equals(obj.type)) return false;

		if (Calculus.getEqualsPriority(obj, context) > Calculus.getEqualsPriority(self, context))
			return Calculus.equalsInternal(obj, self, context);
		
		return Calculus.equalsInternal(self, obj, context);

		// })();
		// console.log(`${self}\n\n${obj}\n\nresult:`, ret);
		// return ret;
	}

	/**
	 * 
	 * @return 같지 않으면 `false`. 같으면 같음을 보이는 데 사용한 매크로들의 목록.
	 */
	protected static equalsInternal(self: Expr, obj: Expr, context: ExecutionContext): (Fun | Variable)[] | false {
		if (self instanceof $Variable) {
			return Calculus.equals(self.expr, obj, context);
		}

		if (self instanceof Conditional) {
			if (!(obj instanceof Conditional)) {
				throw Error('Assertion failed');
			}
	
			if (self.left.length != obj.left.length) {
				throw Error('Assertion failed');
			}
	
			for (var i = 0; i < self.left.length; i++) {
				if (!Calculus.equals(self.left[i], obj.left[i], context)) return false;
			}
	
			return Calculus.equals(self.right, obj.right, context);
		}

		if (self instanceof Fun) {
			if (!self.isCallable(context)
					&& !(obj instanceof Fun && obj.isCallable(context))) {
				return false;
			}

			var placeholders = [];
			var types = (self.type.resolve() as FunctionalType).from;

			for (var i = 0; i < types.length; i++) {
				placeholders.push(new Parameter({
					type: types[i],
					name: '$' + i,
					selector: null
				}, self.trace));
			}

			var usedMacrosList = [];

			var thisCall = (() => {
				if (self.isCallable(context)) {
					if (self.name) {
						usedMacrosList.push(self);
					}

					return self.call(placeholders);
				}

				return new Funcall({
					fun: self,
					args: placeholders
				}, self.trace);
			})();
			
			var objCall = (() => {
				if (obj instanceof Fun && obj.isCallable(context)) {
					if (obj.name) {
						usedMacrosList.push(obj);
					}

					return obj.call(placeholders);
				}

				return new Funcall({
					fun: obj,
					args: placeholders
				}, self.trace);
			})();
			
			var ret = Calculus.equals(thisCall, objCall, context);
			return ret && ret.concat(usedMacrosList);
		}

		if (self instanceof Funcall) {
			if (!(obj instanceof Funcall)) {
				if (!self.isExpandableOnce(context)) return false;
				
				var {expanded, used} = self.expandOnce(context);
				var ret = Calculus.equals(expanded, obj, context);
				return ret && ret.concat(used);
			}
	
			var argsEquals: (Fun | Variable)[] | false = (() => {
				if (self.args.length != obj.args.length) return false;
	
				var tmp: (Fun | Variable)[] = [];
	
				for (var i = 0; i < self.args.length; i++) {
					var e = Calculus.equals(self.args[i], obj.args[i], context);
					if (!e) return false;
					tmp = tmp.concat(e);
				}
	
				return tmp;
			})();
	
			if (argsEquals) {
				var funEquals = Calculus.equals(self.fun, obj.fun, context);
				if (funEquals) return funEquals.concat(argsEquals);
			}
	
			if (self.isExpandableOnce(context)) {
				var {expanded, used} = self.expandOnce(context);
				var ret = Calculus.equals(expanded, obj, context);
				return ret && ret.concat(used);
			}
	
			if (obj.isExpandableOnce(context)) {
				var {expanded, used} = obj.expandOnce(context);
				var ret = Calculus.equals(self, expanded, context);
				return ret && ret.concat(used);
			}
	
			return false;
		}

		if (self instanceof Reduction) {
			return Calculus.equals(self.consequent, obj, context);
		}

		if (self instanceof Variable) {
			if (!self.expr) return false;

			if (!self.sealed || context.canUse(self)) {
				var tmp = Calculus.equals(self.expr, obj, context);
				if (!tmp) return tmp;
				return tmp.push(self), tmp;
			}

			return false;
		}

		if (self instanceof With) {
			throw new Error("Method not implemented.");
		}

		throw Error('Unknown expression type');
	}

	public static isProved(self: Expr, hypotheses?: Expr[]): boolean {
		hypotheses = hypotheses || [];

		for (var i = 0; i < hypotheses.length; i++) {
			if (hypotheses[i] == self) return true;
		}

		return Calculus.isProvedInternal(self, hypotheses);
	}

	private static schemaProvedCache: Map<Schema, boolean> = new Map();

	protected static isProvedInternal(self: Expr, hypotheses: Expr[]): boolean {
		if (self instanceof $Variable) {
			return Calculus.isProved(self.expr, hypotheses);
		}

		if (self instanceof Conditional) {
			return Calculus.isProved(self.right, hypotheses.concat(self.left));
		}

		if (self instanceof ObjectFun) {
			return self.expr && Calculus.isProved(self.expr, hypotheses);
		}

		if (self instanceof Funcall) {
			return Calculus.isProved(self.fun, hypotheses);
		}

		if (self instanceof Reduction) {
			return Calculus.isProved(self.subject, hypotheses)
				&& self.antecedents.every(l => Calculus.isProved(l, hypotheses));
		}

		if (self instanceof Schema) {
			if (Calculus.schemaProvedCache.has(self)) {
				var cache = Calculus.schemaProvedCache.get(self);
				if (cache) return true;

				if (hypotheses.length == 0) {
					return cache;
				}
			}

			var ret = self.schemaType == 'axiom' || Calculus.isProved(self.expr, hypotheses);
			if (!hypotheses.length) Calculus.schemaProvedCache.set(self, ret);
			return ret;
		}

		if (self instanceof Variable) {
			return false;
		}

		if (self instanceof With) {
			return Calculus.isProved(self.expr, hypotheses);
		}

		throw Error('Unknown expression type');
	}
}

import Expr from "./exprs/Expr";
import ExecutionContext from "./ExecutionContext";
import $Variable from "./exprs/$Variable";
import Conditional from "./exprs/Conditional";
import Fun from "./exprs/Fun";
import Funcall from "./exprs/Funcall";
import ObjectFun from "./exprs/ObjectFun";
import Precedence from "./Precedence";
import Reduction from "./exprs/Reduction";
import Schema from "./exprs/Schema";
import Variable from "./exprs/Variable";
import With from "./exprs/With";
import { FunctionalType } from "./exprs/types";import Parameter from "./exprs/Parameter";

