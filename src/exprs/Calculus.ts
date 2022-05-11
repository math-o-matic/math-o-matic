import $Variable from "./$Variable";
import Conditional from "./Conditional";
import Expr from "./Expr";
import Funcall from "./Funcall";
import ObjectFun from "./ObjectFun";
import Precedence from "./Precedence";
import Reduction from "./Reduction";
import Schema from "./Schema";
import Variable from "./Variable";
import With from "./With";

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
	
			return Calculus.substitute(self.expand(), map);
		}

		throw Error('Unknown expression type');
	}
}