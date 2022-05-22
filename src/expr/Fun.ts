import Expr from './Expr';

export default class Fun extends Expr {

	public readonly params: Parameter[];
	public readonly def$s: $Variable[];
	public readonly expr: Expr;

	constructor ({params, def$s, expr}: FunArgumentType, trace: StackTrace) {
		if (!expr)
			throw Expr.error('Missing expr', trace);
		
		super(
			new FunctionalType({
				from: params.map(variable => variable.type),
				to: expr.type
			}, trace),
			trace
		);
		
		this.params = params;
		this.def$s = def$s || [];
		this.expr = expr;
	}

	/**
	 * 매개변수의 개수.
	 */
	get length(): number {
		return this.params.length;
	}

	public call(args: Expr[]): Expr {
		if (!this.expr) {
			throw Error('Cannot call a primitive fun');
		}

		if (this.params.length != args.length) {
			throw Error('Arguments length mismatch');
		}

		for (var i = 0; i < this.params.length; i++) {
			if (!this.params[i].type.equals(args[i].type)) {
				throw Error('Illegal type');
			}
		}

		var map: Map<Variable, Expr> = new Map();

		for (var i = 0; i < this.params.length; i++) {
			map.set(this.params[i], args[i]);
		}

		return Calculus.substitute(this.expr, map);
	}

	public override toString() {
		return `((${this.params.join(', ')}) => ${this.expr})`;
	}

	protected toTeXStringInternal(prec: Precedence, root: boolean): string {
		var shouldPutParentheses = Precedence.FUNEXPR.shouldPutParentheses(prec);

		return [
			(shouldPutParentheses ? '\\left(' : ''),

			(
				this.params.length == 1
				? this.params[0].toTeXString(Precedence.ZERO)
				: `\\left(${this.params.map(e => e.toTeXString(Precedence.COMMA)).join(', ')}\\right)`
			),
			'\\mapsto ',
			Calculus.expand(this.expr).toTeXString(Precedence.ZERO),

			(shouldPutParentheses ? '\\right)' : '')
		].join('');
	}
}

import Variable from './Variable';
import StackTrace from '../StackTrace';
import ExecutionContext from '../ExecutionContext';
import Parameter from './Parameter';
import { FunctionalType } from './types';
import Calculus from '../Calculus';
import Precedence from '../Precedence';
import $Variable from './$Variable';

interface FunArgumentType {
	params: Parameter[];
	def$s: $Variable[];
	expr: Expr;
}