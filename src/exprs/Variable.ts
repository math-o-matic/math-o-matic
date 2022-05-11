import Expr from './Expr';
import Nameable from './Nameable';

interface VariableArgumentType {
	doc?: string;
	tex?: string;
	sealed: boolean;
	type: Type;
	name: string;
	expr: Expr;
}

export default class Variable extends Expr implements Nameable {

	public readonly doc: string;
	public readonly tex: string;
	public readonly sealed: boolean;
	public readonly type: Type;
	public readonly name: string;
	public readonly expr: Expr | null;

	constructor ({doc, tex, sealed, type, name, expr}: VariableArgumentType, trace: StackTrace) {
		super(type, trace);
		
		if (typeof name != 'string')
			throw Expr.error('Assertion failed', trace);
		
		if (sealed && !expr) {
			throw Expr.error('Cannot seal a primitive fun', trace);
		}

		if (expr && !type.equals(expr.type)) {
			throw Expr.error(`Expression type ${expr.type} failed to match the type ${type} of variable ${name}`, trace);
		}

		this.doc = doc;
		this.tex = tex;
		this.sealed = sealed;
		this.name = name;
		this.expr = expr;
	}

	// pr f
	public toSimpleString() {
		return this.type.toString() + ' ' + this.name;
	}

	public override toIndentedString(indent: number, root?: boolean): string {
		return `${root ? this.type + ' ' : ''}${this.name}<${this._id}>`;
	}

	public override toTeXString(prec?: Precedence, root?: boolean): string {
		prec = prec || Precedence.INFINITY;
		root = typeof root == 'boolean' ? root : false;

		var id = this instanceof Parameter ? `id-${this._id}` : `def-${this.name}`;

		var tex = this.tex || TeXUtils.makeTeXName(this.name);
		
		var expr = root && this.expr
			? `\\coloneqq ${this.expr.toTeXString(Precedence.COLONEQQ)}`
			: '';
		
		return `\\href{#${id}}{${tex}}${expr}`;
	}
}

import Parameter from './Parameter';
import { Type } from './types';import Precedence from '../Precedence';
import StackTrace from '../StackTrace';
import TeXUtils from '../TeXUtils';
