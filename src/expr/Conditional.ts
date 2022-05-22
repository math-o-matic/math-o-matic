import Expr from './Expr';

interface ConditionalArgumentType {
	left: Expr[];
	def$s: $Variable[];
	right: Expr;
}

export default class Conditional extends Expr {

	public readonly left: Expr[];
	public readonly def$s: $Variable[];
	public readonly right: Expr;

	constructor ({left, def$s, right}: ConditionalArgumentType, trace: StackTrace) {
		super(new ConditionalType({
			left: left.map(e => e.type),
			right: right.type
		}, trace), trace);

		this.left = left;
		this.def$s = def$s;
		this.right = right;
	}

	public override toString() {
		return `(${this.left.join(', ')} |- ${this.right})`;
	}
	
	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		var expanded = Calculus.expand(this) as Conditional;

		var shouldPutParentheses = Precedence.COMMA.shouldPutParentheses(prec);

		return [
			(shouldPutParentheses ? '\\left(' : ''),
			`{${expanded.left.map(e => e.toTeXString(Precedence.COMMA)).join(', ')} \\vdash ${expanded.right.toTeXString(Precedence.COMMA)}}`,
			(shouldPutParentheses ? '\\right)' : '')
		].join('');
	}
}

import StackTrace from '../StackTrace';
import $Variable from './$Variable';
import { ConditionalType } from './types';
import Precedence from '../Precedence';
import Calculus from '../Calculus';
