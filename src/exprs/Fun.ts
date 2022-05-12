import Nameable from './Nameable';
import Expr from './Expr';

export default abstract class Fun extends Expr implements Nameable {

	public readonly doc: string;
	public readonly precedence: Precedence;
	public readonly tex: string;
	public readonly name: string;
	public readonly params: Parameter[];
	public readonly expr: Expr;

	constructor ({doc, precedence, tex, rettype, name, params, expr}: FunArgumentType, trace: StackTrace) {
		if (!name && !expr)
			throw Expr.error('Anonymous fun cannot be primitive', trace);

		if (rettype && expr) {
			if (!rettype.equals(expr.type)) {
				throw Expr.error(`Expression type ${expr.type} failed to match the return type ${rettype} of fun ${name}`, trace);
			}
		}

		if (!rettype && !expr) {
			throw Expr.error('Cannot guess the return type of a primitive fun', trace);
		}
		
		super(
			new FunctionalType({
				from: params.map(variable => variable.type),
				to: rettype || expr.type as any
			}, trace),
			trace
		);

		this.doc = doc;
		this.precedence = precedence;
		this.tex = tex;
		this.name = name;
		this.params = params;
		this.expr = expr;
	}

	/**
	 * 매개변수의 개수.
	 */
	get length(): number {
		return this.params.length;
	}

	public abstract isExpandable(context: ExecutionContext): boolean;

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
}

import Variable from './Variable';
import StackTrace from '../StackTrace';
import ExecutionContext from '../ExecutionContext';
import Parameter from './Parameter';
import { FunctionalType, Type } from './types';
import Precedence from '../Precedence';
import Calculus from '../Calculus';

interface FunArgumentType {
	doc: string;
	precedence: Precedence;
	tex: string;
	rettype: Type;
	name: string;
	params: Parameter[];
	expr: Expr;
}