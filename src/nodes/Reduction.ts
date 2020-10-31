import Node, { Precedence } from './Node';
import Funcall from './Funcall';
import ExpressionResolver from '../ExpressionResolver';
import Scope from '../Scope';
import Tee from './Tee';
import Fun from './Fun';
import MetaType from './MetaType';
import Metaexpr from './Metaexpr';
import Expr0 from './Expr0';
import Variable from './Variable';
import ObjectType from './ObjectType';

interface ReductionArgumentType {
	subject: Metaexpr;
	guesses: Expr0[];
	leftargs: Metaexpr[];
	expected: Metaexpr;
}

export default class Reduction extends Metaexpr {
	
	public readonly subject: Metaexpr;
	public readonly guesses;
	public readonly leftargs;
	public readonly reduced;
	public readonly type;

	constructor ({subject, guesses, leftargs, expected}: ReductionArgumentType, scope?: Scope) {
		if (guesses) {
			let resolvedType = subject.type.resolve() as ObjectType | MetaType,
				paramTypes = resolvedType.from,
				argTypes = guesses.map(e => e && e.type);

			if (paramTypes.length != argTypes.length)
				throw Node.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`, scope);

			for (var i = 0; i < paramTypes.length; i++) {
				if (argTypes[i] && !paramTypes[i].equals(argTypes[i])) {
					throw Node.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`, scope);
				}
			}
		}

		if (subject instanceof Fun) {
			subject.params.forEach((p, i) => {
				if (!(guesses && guesses[i]) && !p.guess) {
					throw Node.error(`Argument #${i + 1} could not be guessed`, scope);
				}
			});
	
			var derefs = subject.params.map((p, i) => {
				if (guesses && guesses[i]) return guesses[i];

				var tee = ExpressionResolver.expandMeta((subject as Fun).expr) as Tee;
	
				return Reduction.query(
					p.guess,
					tee.left,
					leftargs,
					tee.right,
					expected,
					scope
				);
			});
	
			subject = new Funcall({
				fun: subject,
				args: derefs,
			}, scope);
		} else if (guesses) {
			throw Node.error('Something\'s wrong', scope);
		}
	
		if (!(subject.type instanceof MetaType && subject.type.isSimple))
			throw Node.error('Subject is not reducible', scope);
	
		if (!(leftargs instanceof Array)
				|| leftargs.map(e => e instanceof Node).some(e => !e))
			throw Node.error('Assertion failed', scope);

		var paramTypes = subject.type.left,
			leftargTypes = leftargs.map(e => e.type);

		if (paramTypes.length != leftargTypes.length)
			throw Node.error(`Invalid number of arguments (expected ${paramTypes.length}): ${leftargTypes.length}`, scope);

		for (let i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(leftargTypes[i]))
				throw Node.error(`Illegal argument type (expected ${paramTypes[i]}): ${leftargTypes[i]}`, scope);
		}

		super(scope, null, null, subject.type.right);

		this.subject = subject;
		this.leftargs = leftargs;

		var tee = ExpressionResolver.expandMetaAndFuncalls(subject);

		if (!(tee instanceof Tee)) {
			throw Node.error('Assertion failed', scope);
		}

		for (let i = 0; i < tee.left.length; i++) {
			if (!ExpressionResolver.equals(tee.left[i], leftargs[i])) {
				throw Node.error(`LHS #${i + 1} failed to match:

--- EXPECTED ---
${ExpressionResolver.expandMetaAndFuncalls(tee.left[i])}
----------------

--- RECEIVED ---
${ExpressionResolver.expandMetaAndFuncalls(leftargs[i])}
----------------`, scope);
			}
		}

		if (expected) {
			if (!ExpressionResolver.equals(tee.right, expected)) {
				throw Node.error(`RHS failed to match:

--- EXPECTED ---
${ExpressionResolver.expandMetaAndFuncalls(tee.right)}
----------------

--- RECEIVED ---
${ExpressionResolver.expandMetaAndFuncalls(expected)}
----------------`, scope);
			}

			this.reduced = expected;
		} else {
			this.reduced = tee.right;
		}
	}

	public isProved(hyps?): boolean {
		hyps = hyps || [];
		
		return super.isProved(hyps)
			|| this.subject.isProved(hyps)
				&& this.leftargs.every(l => l.isProved(hyps));
	}

	public substitute(map: Map<Variable, Expr0>): Metaexpr {
		return this.reduced.substitute(map);
	}

	public static query(guess, left, leftargs, right, expected, scope: Scope) {
		if (guess.length == 0) throw Node.error('wut', scope);

		var lef, ret;

		if (guess[0] == 'r') {
			if (!expected) {
				throw Node.error(`Cannot dereference @${guess}`, scope);
			}

			lef = right;
			ret = expected;
		} else {
			if (!(1 <= guess[0] * 1 && guess[0] * 1 <= leftargs.length))
				throw Node.error(`Cannot dereference @${guess}: antecedent index out of range`, scope);

			lef = left[guess[0] * 1 - 1];
			ret = leftargs[guess[0] * 1 - 1];
		}

		return (function recurse(guess, lef, node, ptr) {
			node = ExpressionResolver.expandMetaAndFuncalls(node);
			
			if (guess.length <= ptr) return node;

			if (/[0-9]/.test(guess[ptr])) {
				var n = guess[ptr] * 1;

				if (lef instanceof Tee && node instanceof Tee) {
					if (lef.left.length != node.left.length) {
						throw Node.error(`Cannot dereference @${guess}: antecedent length mismatch`, scope);
					}

					if (!(1 <= n && n <= node.left.length)) {
						throw Node.error(`Cannot dereference @${guess}: antecedent index out of range`, scope);
					}

					return recurse(guess, lef.left[n - 1], node.left[n - 1], ptr + 1);
				}

				while (true) {
					if (!lef.fun || !node.fun) {
						throw Node.error(`Cannot dereference @${guess}`, scope);
					}

					if (ExpressionResolver.equals(lef.fun, node.fun)) {
						break;
					}

					if (!node.fun.expr) {
						throw Node.error(`Cannot dereference @${guess}`, scope);
					}

					node = ExpressionResolver.expandCallOnce(node);
				}

				if (!node.args || !(1 <= n && n <= node.args.length))
					throw Node.error(`Cannot dereference @${guess}`, scope);

				return recurse(guess, lef.args[n - 1], node.args[n - 1], ptr + 1);
			} else if (guess[ptr] == 'r') {
				if (lef instanceof Tee && node instanceof Tee) {
					return recurse(guess, lef.right, node.right, ptr + 1);
				}

				throw Node.error(`Cannot dereference @${guess}`, scope);
			}

			throw Node.error(`Cannot dereference @${guess}`, scope);
		})(guess, lef, ret, 1);
	}

	public toIndentedString(indent: number, root?: boolean): string {
		var leftargs = this.leftargs.map(arg => {
			return arg.toIndentedString(indent + 1);
		});
	
		if (leftargs.join('').length <= 50) {
			leftargs = this.leftargs.map(arg => {
				return arg.toIndentedString(indent);
			});
	
			leftargs = leftargs.join(', ');
	
			return [
				`${this.subject.toIndentedString(indent)}[`,
				leftargs,
				']'
			].join('');
		}
		else {
			leftargs = leftargs.join(',\n' + '\t'.repeat(indent + 1));
	
			return [
				`${this.subject.toIndentedString(indent)}[`,
				'\t' + leftargs,
				']'
			].join('\n' + '\t'.repeat(indent));
		}
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		return `${this.subject.toTeXString(false)}[${this.leftargs.map(e => e.toTeXString(Node.PREC_COMMA)).join(', ')}]`;
	}
}