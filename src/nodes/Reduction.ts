import Node, { Precedence } from './Node';
import Schemacall from './Schemacall';

import ExpressionResolver from '../ExpressionResolver';
import Scope from '../Scope';
import Tee from './Tee';

export default class Reduction extends Node {
	public readonly _type = 'reduction';

	public readonly subject: Node;
	public readonly guesses;
	public readonly leftargs;
	public readonly reduced;
	public readonly type;

	constructor ({subject, guesses, leftargs}, scope?: Scope) {
		super(scope);

		if (!subject.native && subject._type == 'schema') {
			subject.params.forEach((p, i) => {
				if (!(guesses && guesses[i]) && !p.guess) {
					throw this.error(`Argument #${i + 1} could not be guessed`);
				}
			});
	
			var derefs = subject.params.map((p, i) => {
				if (guesses && guesses[i]) return guesses[i];
	
				return this.query(
					p.guess,
					(ExpressionResolver.expandMeta(subject.expr) as Tee).left,
					leftargs
				);
			});
	
			subject = new Schemacall({
				schema: subject,
				args: derefs,
			}, scope);
		} else if (guesses) {
			throw this.error('Something\'s wrong');
		}
	
		if (!subject.native
				&& !(subject.type._type == 'metatype' && subject.type.isSimple))
			throw this.error('Subject is not reducible');
	
		if (!(leftargs instanceof Array)
				|| leftargs.map(e => e instanceof Node).some(e => !e))
			throw this.error('Assertion failed');
		
		this.subject = subject;
		this.leftargs = leftargs;
	
		if (subject.native) {
			this.reduced = subject.native.get(leftargs);
			this.type = this.reduced.type;
		} else {
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
	
			this.reduced = tee.right;
		}
	}

	public isProved(hyps?) {
		hyps = hyps || [];
		
		return super.isProved(hyps)
			|| this.subject.isProved(hyps)
				&& this.leftargs.every(l => l.isProved(hyps));
	}

	public query(guess, left, leftargs) {
		if (guess.length == 0) throw this.error('wut');

		if (!(1 <= guess[0] * 1 && guess[0] * 1 <= leftargs.length))
			throw this.error(`Cannot dereference @${guess}: antecedent index out of range`);

		var lef = left[guess[0] * 1 - 1];
		var ret = leftargs[guess[0] * 1 - 1];

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
					if (!lef.fun || !node.fun) {
						throw that.error(`Cannot dereference @${guess}`);
					}

					if (ExpressionResolver.equals(lef.fun, node.fun)) {
						break;
					}

					if (!node.fun.expr) {
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