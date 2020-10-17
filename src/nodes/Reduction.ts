import Node, { Precedence } from './Node';
import Schemacall from './Schemacall';

import ExpressionResolver, { Expr0, Metaexpr } from '../ExpressionResolver';
import Scope from '../Scope';
import Tee from './Tee';

interface ReductionArgumentType {
	subject: Metaexpr;
	guesses: Expr0[];
	leftargs: Metaexpr[];
	expected: Metaexpr;
}

export default class Reduction extends Node {
	public readonly _type = 'reduction';

	public readonly subject: Metaexpr;
	public readonly guesses;
	public readonly leftargs;
	public readonly reduced;
	public readonly type;

	constructor ({subject, guesses, leftargs, expected}: ReductionArgumentType, scope?: Scope) {
		super(scope);

		if (guesses) {
			var resolvedType = subject.type.resolve(),
				paramTypes = resolvedType.from,
				argTypes = guesses.map(e => e && e.type);

			if (paramTypes.length != argTypes.length)
				throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

			for (var i = 0; i < paramTypes.length; i++) {
				if (argTypes[i] && !paramTypes[i].equals(argTypes[i])) {
					throw this.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
				}
			}
		}

		if (subject._type == 'schema') {
			subject.params.forEach((p, i) => {
				if (!(guesses && guesses[i]) && !p.guess) {
					throw this.error(`Argument #${i + 1} could not be guessed`);
				}
			});
	
			var derefs = subject.params.map((p, i) => {
				if (guesses && guesses[i]) return guesses[i];

				// @ts-ignore
				var tee = ExpressionResolver.expandMeta(subject.expr) as Tee;
	
				return this.query(
					p.guess,
					tee.left,
					leftargs,
					tee.right,
					expected
				);
			});
	
			subject = new Schemacall({
				schema: subject,
				args: derefs,
			}, scope);
		} else if (guesses) {
			throw this.error('Something\'s wrong');
		}
	
		if (!(subject.type._type == 'metatype' && subject.type.isSimple))
			throw this.error('Subject is not reducible');
	
		if (!(leftargs instanceof Array)
				|| leftargs.map(e => e instanceof Node).some(e => !e))
			throw this.error('Assertion failed');
		
		this.subject = subject;
		this.leftargs = leftargs;

		var paramTypes = subject.type.left,
			leftargTypes = leftargs.map(e => e.type);

		if (paramTypes.length != leftargTypes.length)
			throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${leftargTypes.length}`);

		for (let i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(leftargTypes[i]))
				throw this.error(`Illegal argument type (expected ${paramTypes[i]}): ${leftargTypes[i]}`);
		}

		this.type = subject.type.right;

		var tee = ExpressionResolver.expandMetaAndFuncalls(subject);

		if (tee._type != 'tee') {
			throw this.error('Assertion failed');
		}

		for (let i = 0; i < tee.left.length; i++) {
			if (!ExpressionResolver.equals(tee.left[i], leftargs[i])) {
				throw this.error(`LHS #${i + 1} failed to match:

--- EXPECTED ---
${ExpressionResolver.expandMetaAndFuncalls(tee.left[i])}
----------------

--- RECEIVED ---
${ExpressionResolver.expandMetaAndFuncalls(leftargs[i])}
----------------`);
			}
		}

		if (expected) {
			if (!ExpressionResolver.equals(tee.right, expected)) {
				throw this.error(`RHS failed to match:

--- EXPECTED ---
${ExpressionResolver.expandMetaAndFuncalls(tee.right)}
----------------

--- RECEIVED ---
${ExpressionResolver.expandMetaAndFuncalls(expected)}
----------------`);
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

	public query(guess, left, leftargs, right, expected) {
		if (guess.length == 0) throw this.error('wut');

		var lef, ret;

		if (guess[0] == 'r') {
			if (!expected) {
				throw this.error(`Cannot dereference @${guess}`);
			}

			lef = right;
			ret = expected;
		} else {
			if (!(1 <= guess[0] * 1 && guess[0] * 1 <= leftargs.length))
				throw this.error(`Cannot dereference @${guess}: antecedent index out of range`);

			lef = left[guess[0] * 1 - 1];
			ret = leftargs[guess[0] * 1 - 1];
		}

		var that = this;

		return (function recurse(guess, lef, node, ptr) {
			node = ExpressionResolver.expandMetaAndFuncalls(node);
			
			if (guess.length <= ptr) return node;

			if (/[0-9]/.test(guess[ptr])) {
				var n = guess[ptr] * 1;

				if (lef._type == 'tee' && node._type == 'tee') {
					if (lef.left.length != node.left.length) {
						throw that.error(`Cannot dereference @${guess}: antecedent length mismatch`);
					}

					if (!(1 <= n && n <= node.left.length)) {
						throw that.error(`Cannot dereference @${guess}: antecedent index out of range`);
					}

					return recurse(guess, lef.left[n - 1], node.left[n - 1], ptr + 1);
				}

				while (true) {
					if (!lef.schema || !node.schema) {
						throw that.error(`Cannot dereference @${guess}`);
					}

					if (ExpressionResolver.equals(lef.schema, node.schema)) {
						break;
					}

					if (!node.schema.expr) {
						throw that.error(`Cannot dereference @${guess}`);
					}

					node = ExpressionResolver.expandCallOnce(node);
				}

				if (!node.args || !(1 <= n && n <= node.args.length))
					throw that.error(`Cannot dereference @${guess}`);

				return recurse(guess, lef.args[n - 1], node.args[n - 1], ptr + 1);
			} else if (guess[ptr] == 'r') {
				if (lef._type == 'tee' && node._type == 'tee') {
					return recurse(guess, lef.right, node.right, ptr + 1);
				}

				throw that.error(`Cannot dereference @${guess}`);
			}

			throw that.error(`Cannot dereference @${guess}`);
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