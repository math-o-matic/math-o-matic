import Scope from '../Scope';
import Expr0 from './Expr0';
import Nameable from './Nameable';
import Node, {Precedence} from './Node';
import ObjectType from './ObjectType';

interface VariableArgumentType {
	doc?: string;
	tex?: string;
	type: ObjectType;
	name: string;
	isParam: boolean;
	guess?: string;
}

export default class Variable extends Expr0 implements Nameable {
	public readonly isParam: boolean;
	public readonly guess: string;
	public readonly type: ObjectType;
	public readonly name: string;

	constructor ({doc, tex, type, name, isParam, guess}: VariableArgumentType, scope?: Scope) {
		super(scope, doc, tex, type);

		this.isParam = !!isParam;
		this.guess = guess || null;

		if (typeof name != 'string')
			throw Node.error('Assertion failed', scope);

		this.name = name;
	}

	public isProved(hyps) {
		hyps = hyps || [];
	
		return super.isProved(hyps);
	}

	// pr f
	public toSimpleString() {
		return this.type.toSimpleString() + ' ' + this.name;
	}

	public toIndentedString(indent: number, root?: boolean): string {
		return `${root ? this.type + ' ' : ''}${this.name}<${this._id}>`;
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		var id = this.isParam ? `id-${this._id}` : `def-${this.name}`;

		var tex = this.tex
			|| (
				this.name.length == 1
					? Node.escapeTeX(this.name)
					: `\\mathrm{${Node.escapeTeX(this.name)}}`
			);
		
		return `\\href{#${id}}{${tex}}`;
	}

	public toTeXStringWithId(prec?: Precedence, root?: boolean): string {
		if (!this.isParam) throw Error('wut');

		var id =`id-${this._id}`;

		return [
			`\\htmlId{${id}}{`,
			this.toTeXString(prec, root),
			`}`
		].join('');
	}
}