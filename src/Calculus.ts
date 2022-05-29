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
	 * 현재 다음의 두 가지 경우에서 사용된다.
	 * 
	 * * 함수 호출
	 * * with의 매크로 변수를 그 표현식으로 바꾸는 과정
	 * 
	 * @param map `xi`를 `ri`에 대응시키는 매핑.
	 */
	public static substitute(self: Expr, map: Map<Variable, Expr>): Expr {
		if (self instanceof Variable) {
			if (map.has(self)) return map.get(self)!;

			// 매크로 변수는 스코프 밖에서 보이지 않으므로 치환될 것을 갖지 않는다는
			// 생각이 들어 있다.
			return self;
		}
		
		if (self instanceof $Variable) {
			var expr = Calculus.substitute(self.expr, map);
			if (expr == self.expr) return self;
			return expr;
		}

		if (self instanceof Fun) {
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

			return new Fun({
				params: self.params,
				def$s: self.def$s,
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
	
			return new Conditional({left, def$s: [], right}, self.trace);
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
		if (Calculus.expandCache.has(self)) return Calculus.expandCache.get(self)!;
		var ret = Calculus.expandInternal(self);
		Calculus.expandCache.set(self, ret);
		return ret;
	}

	protected static expandInternal(self: Expr): Expr {
		if (self instanceof $Variable) {
			return Calculus.expand(self.expr);
		}

		if (self instanceof Conditional) {
			var left = self.left.map(lef => Calculus.expand(lef));
			var right = Calculus.expand(self.right);

			if (left.every((l, i) => l == self.left[i]) && right == self.right) return self;

			return new Conditional({left, def$s: [], right}, self.trace);
		}

		if (self instanceof Funcall) {
			var fun = Calculus.expand(self.fun),
				args = self.args.map(arg => Calculus.expand(arg));
			
			if (!(fun instanceof Fun)) {
				if (fun == self.fun && args.every((arg, i) => arg == self.args[i])) return self;
				
				return new Funcall({fun, args}, self.trace);
			}

			return Calculus.expand(fun.call(args));
		}

		if (self instanceof Variable) {
			if (self.decoration instanceof SchemaDecoration) {
				return Calculus.expand(self.expr!);
			}

			return self;
		}

		if (self instanceof Fun) {
			var expr = Calculus.expand(self.expr);
			if (expr == self.expr) return self;

			return new Fun({
				params: self.params,
				def$s: self.def$s,
				expr
			}, self.trace);
		}

		if (self instanceof Reduction) {
			return Calculus.expand(self.consequent);
		}

		if (self instanceof With) {
			var map = new Map<Variable, Expr>();
			map.set(self.variable, self.variable.expr!);

			return Calculus.expand(Calculus.substitute(self.expr, map));
		}

		throw Error('Unknown expression type');
	}

	/**
	 * 
	 * @return 같지 않으면 `false`. 같으면 같음을 보이는 데 사용한 매크로들의 목록.
	 */
	public static equals(self: Expr, obj: Expr, context: ExecutionContext): Variable[] | false {
		// console.log(`${self}\n\n${obj}`);
		// var ret = (() => {

		if (self === obj) return [];
		if (!self.type.equals(obj.type)) return false;
		
		if (self instanceof $Variable) {
			return Calculus.equals(self.expr, obj, context);
		}

		if (obj instanceof $Variable) {
			return Calculus.equals(self, obj.expr, context);
		}

		if (self instanceof Reduction) {
			return Calculus.equals(self.consequent, obj, context);
		}

		if (obj instanceof Reduction) {
			return Calculus.equals(self, obj.consequent, context);
		}

		if (self instanceof Variable && self.isExpandable(context)
				&& obj instanceof Variable && obj.isExpandable(context)) {
			if (self._id > obj._id) {
				var ret = Calculus.equals(self.expr!, obj, context);
				if (!ret) return ret;
				ret.push(self);
				return ret;
			} else {
				var ret = Calculus.equals(self, obj.expr!, context);
				if (!ret) return ret;
				ret.push(obj);
				return ret;
			}
		}

		if (self instanceof Variable && self.isExpandable(context)) {
			var ret = Calculus.equals(self.expr!, obj, context);
			if (!ret) return ret;
			ret.push(self);
			return ret;
		}

		if (obj instanceof Variable && obj.isExpandable(context)) {
			var ret = Calculus.equals(self, obj.expr!, context);
			if (!ret) return ret;
			ret.push(obj);
			return ret;
		}

		if (self instanceof Funcall) {
			if (!(obj instanceof Funcall)) {
				if (!self.isExpandableOnce(context)) return false;
				
				var {expanded, used} = self.expandOnce(context);
				var ret = Calculus.equals(expanded, obj, context);
				return ret && ret.concat(used);
			}
	
			var argsEquals: Variable[] | false = (() => {
				if (self.args.length != obj.args.length) return false;
	
				var tmp: Variable[] = [];
	
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

		if (obj instanceof Funcall) {
			return Calculus.equals(obj, self, context);
		}

		if (self instanceof Conditional) {
			if (!(obj instanceof Conditional)) {
				return false;
			}
	
			if (self.left.length != obj.left.length) {
				return false;
			}
	
			for (var i = 0; i < self.left.length; i++) {
				if (!Calculus.equals(self.left[i], obj.left[i], context)) return false;
			}
	
			return Calculus.equals(self.right, obj.right, context);
		}

		if (obj instanceof Conditional) {
			return Calculus.equals(obj, self, context);
		}

		if (self instanceof Fun) {
			var placeholders = [];
			var types = (self.type.resolve() as FunctionalType).from;

			for (var i = 0; i < types.length; i++) {
				placeholders.push(new Parameter({
					decoration: new SimpleAtomicDecoration({
						doc: null,
						tex: null
					}),
					type: types[i],
					name: '$' + i,
					selector: null
				}, self.trace));
			}

			var usedMacrosList: Variable[] = [];

			var thisCall = self.call(placeholders);
			
			var objCall = (() => {
				if (obj instanceof Fun) {
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

		if (obj instanceof Fun) {
			return Calculus.equals(obj, self, context);
		}

		if (self instanceof Variable && !self.isExpandable(context)) {
			return false;
		}

		if (obj instanceof Variable && !obj.isExpandable(context)) {
			return false;
		}

		throw Error(`Unknown expression type ${self.constructor.name}`);

		// })();
		// console.log(`${self}\n\n${obj}\n\nresult: ${ret}`);
		// return ret;
	}

	private static schemaProvedCache = new Map<Variable, boolean>();

	public static isProved(self: Expr, hypotheses?: Expr[]): boolean {
		hypotheses = hypotheses || [];

		for (var i = 0; i < hypotheses.length; i++) {
			if (hypotheses[i] == self) return true;
		}

		if (self instanceof $Variable) {
			return Calculus.isProved(self.expr, hypotheses);
		}

		if (self instanceof Conditional) {
			return Calculus.isProved(self.right, hypotheses.concat(self.left));
		}

		if (self instanceof Variable) {
			if (self.decoration instanceof SchemaDecoration) {
				if (Calculus.schemaProvedCache.has(self)) {
					var cache = Calculus.schemaProvedCache.get(self)!;
					if (cache) return true;

					if (hypotheses.length == 0) {
						return cache;
					}
				}

				var ret = self.decoration.schemaType == 'axiom' || Calculus.isProved(self.expr!, hypotheses);
				if (!hypotheses.length) Calculus.schemaProvedCache.set(self, ret);
				return ret;
			}
			
			return false;
		}

		if (self instanceof Fun) {
			return Calculus.isProved(self.expr, hypotheses);
		}

		if (self instanceof Funcall) {
			return Calculus.isProved(self.fun, hypotheses);
		}

		if (self instanceof Reduction) {
			return Calculus.isProved(self.subject, hypotheses)
				&& self.antecedents.every(l => Calculus.isProved(l, hypotheses));
		}

		if (self instanceof With) {
			return Calculus.isProved(self.expr, hypotheses);
		}

		throw Error('Unknown expression type');
	}

	public static getProof(self: Expr): ProofType[] {
		return Calculus.getProofInternal(self, new Map(), new Map(), new Counter(), true);
	}

	protected static getProofInternal(
			self: Expr,
			hypothesisMap: Map<Expr, number>,
			$Map: Map<Expr, number | [number, number]>,
			ctr: Counter,
			root: boolean=false): ProofType[] {
		
		if (hypothesisMap.has(self)) {
			return [{
				_type: 'R',
				ctr: ctr.next(),
				num: hypothesisMap.get(self)!,
				expr: self
			}];
		}

		if ($Map.has(self)) {
			return [{
				_type: 'R',
				ctr: ctr.next(),
				num: $Map.get(self)!,
				expr: self
			}];
		}
		
		if (self instanceof $Variable) {
			if (!$Map.has(self)) {
				throw Error(`${self.name} is not defined`);
			}
	
			return [{
				_type: 'R',
				ctr: ctr.next(),
				num: $Map.get(self)!,
				expr: self.expr
			}];
		}

		if (self instanceof Conditional) {
			hypothesisMap = new Map(hypothesisMap);

			var start = ctr.peek() + 1;

			var leftlines: ProofType[] = self.left.map(l => {
				hypothesisMap.set(l, ctr.next());
				
				return {
					_type: 'H',
					ctr: ctr.peek(),
					expr: l
				};
			});

			$Map = new Map($Map);

			let $lines = self.def$s.map($ => {
				var lines = Calculus.getProofInternal($.expr, hypothesisMap, $Map, ctr);
				var $num = lines[lines.length - 1].ctr;
				$Map.set($, $num);
				return lines;
			}).flat(1);

			return [{
				_type: 'T',
				leftlines: leftlines as any,
				rightlines: $lines.concat(Calculus.getProofInternal(self.right, hypothesisMap, $Map, ctr)),
				ctr: [start, ctr.peek()]
			}];
		}

		if (self instanceof Variable) {
			if (self.decoration instanceof SchemaDecoration) {
				if (!root) {
					return [{
						_type: 'RS',
						ctr: ctr.next(),
						expr: self
					}];
				}
				
				return Calculus.getProofInternal(self.expr!, hypothesisMap, $Map, ctr, root);
			}

			return [{
				_type: 'NP',
				ctr: ctr.next(),
				expr: self
			}];
		}

		if (self instanceof Fun) {
			$Map = new Map($Map);
	
			var start = ctr.peek() + 1;
	
			let $lines: ProofType[] = [];
			
			self.def$s.forEach($ => {
				var lines = Calculus.getProofInternal($.expr, hypothesisMap, $Map, ctr);
				$lines = $lines.concat(lines);

				var $num = lines[lines.length - 1].ctr;
				$Map.set($, $num);
			});
	
			return [{
				_type: 'V',
				$lines,
				lines: Calculus.getProofInternal(self.expr, hypothesisMap, $Map, ctr),
				params: self.params,
				ctr: [start, ctr.peek()]
			}];
		}

		if (self instanceof Funcall) {
			if (hypothesisMap.has(self.fun)) {
				return [{
					_type: 'SE',
					ctr: ctr.next(),
					schema: hypothesisMap.get(self.fun)!,
					args: self.args,
					expr: self
				}];
			}
	
			if ($Map.has(self.fun)) {
				return [{
					_type: 'SE',
					ctr: ctr.next(),
					schema: $Map.get(self.fun)!,
					args: self.args,
					expr: self
				}];
			}
	
			if (self.fun instanceof Variable 
					&& self.fun.decoration instanceof SchemaDecoration) {
				return [{
					_type: 'RC',
					ctr: ctr.next(),
					expr: self
				}];
			}
	
			if (!(self.fun instanceof Variable
					&& self.fun.decoration instanceof SchemaDecoration)) {
				return [{
					_type: 'NP',
					ctr: ctr.next(),
					expr: self
				}];
			}
	
			var schemalines = Calculus.getProofInternal(self.fun, hypothesisMap, $Map, ctr);
	
			return [
				...schemalines,
				{
					_type: 'SE',
					ctr: ctr.next(),
					schema: schemalines[schemalines.length - 1].ctr,
					args: self.args,
					expr: self
				}
			];
		}

		if (self instanceof Reduction) {
			var antecedentLinesList: ProofType[][] = [];
			var antecedentNums: (number | [number, number])[] = self.antecedents.map((l, i) => {
				if (!self.antecedentEqualsResults[i].length) {
					if (hypothesisMap.has(l)) return hypothesisMap.get(l)!;
					if ($Map.has(l)) return $Map.get(l)!;
				}

				var ref = hypothesisMap.has(l)
					? hypothesisMap.get(l)
					: $Map.has(l)
						? $Map.get(l)
						: null;
				var lines = ref ? [] : Calculus.getProofInternal(l, hypothesisMap, $Map, ctr);

				if (self.antecedentEqualsResults[i].length) {
					lines.push({
						_type: 'bydef',
						ctr: ctr.next(),
						ref: ref || lines[lines.length - 1].ctr,
						expr: self.requiredAntecedents[i],
						of: self.antecedentEqualsResults[i]
					});
				}

				antecedentLinesList.push(lines);
				return self.antecedentEqualsResults[i].length
					? ctr.peek()
					: lines[lines.length - 1].ctr;
			});
			
			var args: Expr[] | null = null;
			var subjectlines: ProofType[] = [];
			var subjectnum = (() => {
				if (hypothesisMap.has(self.subject)) {
					return hypothesisMap.get(self.subject)!;
				}

				if ($Map.has(self.subject)) {
					return $Map.get(self.subject)!;
				}

				if (self.subject instanceof Funcall && $Map.has(self.subject.fun)) {
					args = self.subject.args;
					return $Map.get(self.subject.fun)!;
				}

				if (self.subject instanceof Variable
						|| self.subject instanceof Funcall
							&& isNameable(self.subject.fun)
							&& self.subject.fun.name) {
					return self.subject;
				}

				subjectlines = Calculus.getProofInternal(self.subject, hypothesisMap, $Map, ctr);

				return subjectlines[subjectlines.length - 1].ctr;
			})();

			var ret: ProofType[] = [
				...antecedentLinesList.flat(),
				...subjectlines
			];

			if (self.rightEqualsResult && self.rightEqualsResult.length) {
				ret.push(
					{
						_type: 'TE',
						ctr: ctr.next(),
						subject: subjectnum,
						args,
						antecedents: antecedentNums,
						reduced: self.preFormatConsequent
					},
					{
						_type: 'bydef',
						ref: ctr.peek(),
						ctr: ctr.next(),
						expr: self.consequent,
						of: self.rightEqualsResult
					}
				);
			} else {
				ret.push({
					_type: 'TE',
					ctr: ctr.next(),
					subject: subjectnum,
					args,
					antecedents: antecedentNums,
					reduced: self.consequent
				});
			}
			
			return ret;
		}

		if (self instanceof With) {
			$Map = new Map($Map);

			var def: ProofType = {
				_type: 'def',
				ctr: ctr.next(),
				var: self.variable
			};

			let $lines = self.def$s.map($ => {
				var lines = Calculus.getProofInternal($.expr, hypothesisMap, $Map, ctr);
				var $num = lines[lines.length - 1].ctr;
				$Map.set($, $num);
				return lines;
			}).flat(1);

			return [
				def,
				...$lines,
				...Calculus.getProofInternal(self.expr, hypothesisMap, $Map, ctr)
			];
		}

		throw Error('Unknown expression type');
	}
}

import Expr from "./expr/Expr";
import ExecutionContext from "./ExecutionContext";
import $Variable from "./expr/$Variable";
import Conditional from "./expr/Conditional";
import Fun from "./expr/Fun";
import Funcall from "./expr/Funcall";
import Reduction from "./expr/Reduction";
import Variable from "./expr/Variable";
import With from "./expr/With";
import Parameter from "./expr/Parameter";
import Counter from "./util/Counter";
import { ProofType } from "./ProofType";
import { isNameable } from "./expr/Nameable";
import SchemaDecoration from "./decoration/SchemaDecoration";
import SimpleAtomicDecoration from "./decoration/SimpleAtomicDecoration";
import { FunctionalType } from "./type/FunctionalType";

