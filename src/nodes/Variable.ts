import Scope from '../Scope';
import Node, {Precedence} from './Node';
import Type from './Type';

interface VariableArgumentType {
	doc?: string;
	tex?: string;
	type: Type;
	name: string;
	isParam: boolean;
	guess?: string;
}

export default class Variable extends Node {
	public readonly isParam: boolean;
	public readonly guess: string;
	public readonly type: Type;
	public readonly name: string;

	constructor ({doc, tex, type, name, isParam, guess}: VariableArgumentType, scope?: Scope) {
		super(scope);

		this.doc = doc;
		this.tex = tex;

		this.isParam = !!isParam;
		this.guess = guess || null;

		if (typeof name != 'string')
			throw this.error('Assertion failed');

		this.type = type;
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