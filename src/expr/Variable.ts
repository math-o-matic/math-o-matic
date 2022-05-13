import Expr from './Expr';
import Nameable from './Nameable';

interface VariableArgumentType {
	decoration: SimpleAtomicDecoration | SimpleMacroDecoration;
	type: Type;
	name: string;
	expr: Expr;
}

export default class Variable extends Expr implements Nameable {

	public readonly decoration: SimpleAtomicDecoration | SimpleMacroDecoration;
	public readonly name: string;
	public readonly expr: Expr;

	constructor ({decoration, type, name, expr}: VariableArgumentType, trace: StackTrace) {
		super(type, trace);
		
		if (typeof name != 'string')
			throw Expr.error('Assertion failed', trace);
		
		if (decoration instanceof SimpleMacroDecoration && decoration.sealed && !expr) {
			throw Expr.error('Cannot seal a primitive fun', trace);
		}

		if (expr && !type.equals(expr.type)) {
			throw Expr.error(`Expression type ${expr.type} failed to match the type ${type} of variable ${name}`, trace);
		}

		this.decoration = decoration;
		this.name = name;
		this.expr = expr;
	}

	public isExpandable(context: ExecutionContext): boolean {
		return this.expr
			&& this.decoration instanceof SimpleMacroDecoration
			&& (!this.decoration.sealed || context.canUse(this));
	}

	// pr f
	public toSimpleString() {
		return this.type.toString() + ' ' + this.name;
	}

	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		var id = this instanceof Parameter ? `id-${this._id}` : `def-${this.name}`;

		var tex = this.decoration.tex || TeXUtils.makeTeXName(this.name);
		
		var expr = root && this.expr
			? `\\coloneqq ${this.expr.toTeXString(Precedence.COLONEQQ)}`
			: '';
		
		return `\\href{#${id}}{${tex}}${expr}`;
	}
}

import Parameter from './Parameter';
import { Type } from './types';
import Precedence from '../Precedence';
import StackTrace from '../StackTrace';
import TeXUtils from '../util/TeXUtils';
import ExecutionContext from '../ExecutionContext';import SimpleAtomicDecoration from '../decoration/SimpleAtomicDecoration';
import SimpleMacroDecoration from '../decoration/SimpleMacroDecoration';

