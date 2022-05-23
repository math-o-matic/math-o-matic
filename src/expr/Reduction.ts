import Expr from "./Expr";

interface ReductionArgumentType {
	antecedents: Expr[];
	subject: Expr;
	args: Expr[];
	as: Expr;
}

export default class Reduction extends Expr {
	
	public readonly antecedents: Expr[];
	public readonly requiredAntecedents: Expr[];
	public readonly subject: Expr;
	public readonly args: Expr[];
	public readonly preFormatConsequent: Expr;
	public readonly consequent: Expr;
	public readonly antecedentEqualsResults: Variable[][];
	public readonly rightEqualsResult: Variable[];

	constructor ({antecedents, subject, args, as}: ReductionArgumentType, context: ExecutionContext, trace: StackTrace) {
		if (args) {
			let resolvedType = subject.type.resolve() as FunctionalType,
				paramTypes = resolvedType.from,
				argTypes = args.map(e => e && e.type);

			if (paramTypes.length != argTypes.length)
				throw Expr.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`, trace);

			for (var i = 0; i < paramTypes.length; i++) {
				if (argTypes[i] && !paramTypes[i].equals(argTypes[i])) {
					throw Expr.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`, trace);
				}
			}
		}

		var fun = subject;

		while (fun instanceof Variable) {
			fun = fun.expr;
		}

		if (fun instanceof Fun) {
			fun.params.forEach((p, i) => {
				if (!(args && args[i]) && !p.selector) {
					throw Expr.error(`Argument #${i + 1} could not be guessed`, trace);
				}
			});
	
			var derefs = fun.params.map((p, i) => {
				if (args && args[i]) return args[i];

				var conditional = Calculus.expand((fun as Fun).expr);

				if (!(conditional instanceof Conditional)) throw Error('wut');
	
				return Reduction.guess(
					p.selector,
					conditional.left, antecedents,
					conditional.right, as,
					context, trace
				);
			});
	
			subject = new Funcall({
				fun: subject,
				args: derefs,
			}, trace);
		} else if (args) {
			throw Expr.error('Something\'s wrong', trace);
		}
	
		if (!(subject.type instanceof ConditionalType))
			throw Expr.error('Subject is not reducible', trace);
	
		if (!(antecedents instanceof Array)
				|| antecedents.map(e => e instanceof Expr).some(e => !e))
			throw Expr.error('Assertion failed', trace);

		var paramTypes = subject.type.left,
			antecedentTypes = antecedents.map(e => e.type);

		if (paramTypes.length != antecedentTypes.length)
			throw Expr.error(`Invalid number of arguments (expected ${paramTypes.length}): ${antecedentTypes.length}`, trace);

		for (let i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(antecedentTypes[i]))
				throw Expr.error(`Illegal argument type (expected ${paramTypes[i]}): ${antecedentTypes[i]}`, trace);
		}

		super(subject.type.right, trace);

		this.subject = subject;
		this.antecedents = antecedents;

		var conditional = Calculus.expand(subject);

		if (!(conditional instanceof Conditional)) {
			throw Expr.error('Assertion failed', trace);
		}

		this.requiredAntecedents = conditional.left;
		this.antecedentEqualsResults = Array(conditional.left.length).fill(0).map(() => []);

		var antecedentsExpanded = antecedents.map(arg => {
			return Calculus.expand(arg);
		});

		for (let i = 0; i < conditional.left.length; i++) {
			var tmp = Calculus.equals(conditional.left[i], antecedentsExpanded[i], context);
			if (!tmp) {
				throw Expr.error(
					InterpolativeString.getInstance`LHS #${i + 1} failed to match:

--- EXPECTED ---
${Calculus.expand(conditional.left[i])}
----------------

--- RECEIVED ---
${Calculus.expand(antecedents[i])}
----------------`, trace);
			}

			this.antecedentEqualsResults[i] = tmp;
		}

		this.preFormatConsequent = conditional.right;

		if (as) {
			var tmp = Calculus.equals(conditional.right, as, context);
			if (!tmp) {
				throw Expr.error(
					InterpolativeString.getInstance`RHS failed to match:

--- EXPECTED ---
${Calculus.expand(conditional.right)}
----------------

--- RECEIVED (from [as ...]) ---
${Calculus.expand(as)}
----------------`, trace);
			}

			this.rightEqualsResult = tmp;
			this.consequent = as;
		} else {
			this.consequent = conditional.right;
		}
	}

	public static guess(
			selector: string,
			requiredAntecedents: Expr[], antecedents: Expr[],
			right: Expr, as: Expr,
			context: ExecutionContext, trace: StackTrace): Expr {
		
		if (selector.length == 0) throw Expr.error('wut', trace);

		var pattern: Expr, instance: Expr;

		if (selector[0] == 'r') {
			if (!as) {
				throw Expr.error(`Cannot dereference @${selector} (at 0): expected output is not given`, trace);
			}

			pattern = right;
			instance = as;
		} else {
			var n = Number(selector[0]);

			if (!(1 <= n && n <= antecedents.length))
				throw Expr.error(`Cannot dereference @${selector} (at 0): antecedent index out of range`, trace);

			pattern = requiredAntecedents[n - 1];
			instance = antecedents[n - 1];
		}

		return (function recurse(
				ptr: number,
				pattern: Expr, instance: Expr,
				params: Parameter[]): Expr {
			
			instance = Calculus.expand(instance);
			
			if (selector.length <= ptr) return instance;

			if (/^[0-9]$/.test(selector[ptr])) {
				var n = Number(selector[ptr]);

				if (pattern instanceof Conditional && instance instanceof Conditional) {
					if (pattern.left.length != instance.left.length) {
						throw Expr.error(`Cannot dereference @${selector} (at ${ptr}): antecedent length mismatch`, trace);
					}

					if (!(1 <= n && n <= instance.left.length)) {
						throw Expr.error(`Cannot dereference @${selector} (at ${ptr}): antecedent index out of range`, trace);
					}

					return recurse(ptr + 1, pattern.left[n - 1], instance.left[n - 1], params);
				}

				while (true) {
					while (instance instanceof Variable && instance.expr) {
						instance = instance.expr;
					}

					if (!(pattern instanceof Funcall && instance instanceof Funcall)) {
						throw Expr.error(`Cannot dereference @${selector} (at ${ptr})`, trace);
					}

					if (Calculus.equals(pattern.fun, instance.fun, context)) {
						break;
					}

					if (!instance.isExpandableOnce(context)) {
						throw Expr.error(`Cannot dereference @${selector} (at ${ptr}): ${instance}`, trace);
					}

					instance = instance.expandOnce(context).expanded;
				}

				if (!(1 <= n && n <= instance.args.length))
					throw Expr.error(`Cannot dereference @${selector} (at ${ptr})`, trace);

				return recurse(ptr + 1, pattern.args[n - 1], instance.args[n - 1], params);
			} else if (selector[ptr] == 'r') {
				if (!(pattern instanceof Conditional && instance instanceof Conditional)) {
					throw Expr.error(`Cannot dereference @${selector} (at ${ptr})`, trace);
				}

				return recurse(ptr + 1, pattern.right, instance.right, params);
			} else if (selector[ptr] == 'c') {
				if (!(
					pattern instanceof Fun
					&& instance instanceof Fun
				)) {
					throw Expr.error(`Cannot dereference @${selector} (at ${ptr})`, trace);
				}

				if (pattern.length != instance.length) {
					throw Expr.error(`Cannot dereference @${selector} (at ${ptr}): parameter length mismatch`, trace);
				}

				var placeholders = [];

				for (var i = 0; i < pattern.length; i++) {
					if (!pattern.params[i].type.equals(instance.params[i].type)) {
						throw Expr.error(`Cannot dereference @${selector} (at ${ptr}): parameter type mismatch`, trace);
					}

					placeholders.push(new Parameter({
						decoration: new SimpleAtomicDecoration({
							doc: null,
							tex: instance.params[i].decoration.tex
						}),
						type: pattern.params[i].type,
						name: instance.params[i].name,
						selector: null
					}, trace));
				}

				return recurse(ptr + 1, pattern.call(placeholders), instance.call(placeholders), placeholders.concat(params));
			} else if (selector[ptr] == 'f') {
				if (ptr != selector.length - 1) {
					throw Expr.error(`Cannot dereference @${selector} (at ${ptr}): invalid selector`, trace);
				}

				// (($0, $1) => f($0, $1)) -> f
				if (instance instanceof Funcall
						&& instance.args.length == params.length
						&& instance.args.every((arg, i) => arg == params[i])) {
					return instance.fun;
				}

				return new Fun({
					params,
					def$s: [],
					expr: instance
				}, trace);
			}

			throw Expr.error(`Cannot dereference @${selector} (at ${ptr}): invalid selector`, trace);
		})(1, pattern, instance, []);
	}

	public override toString() {
		return `[${this.antecedents.join(', ')}] > ${this.subject}`;
	}

	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		return `${this.subject.toTeXString(Precedence.ZERO)}[${this.antecedents.map(e => e.toTeXString(Precedence.COMMA)).join(', ')}]`;
	}
}

import ExecutionContext from "../ExecutionContext";
import StackTrace from "../StackTrace";
import Fun from "./Fun";
import Funcall from "./Funcall";
import Parameter from "./Parameter";
import Conditional from "./Conditional";
import Variable from "./Variable";
import Precedence from "../Precedence";
import Calculus from "../Calculus";
import InterpolativeString from "../util/InterpolativeString";
import SimpleAtomicDecoration from "../decoration/SimpleAtomicDecoration";
import { ConditionalType } from "../type/ConditionalType";
import { FunctionalType } from "../type/FunctionalType";

