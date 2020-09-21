import Scope from '../Scope';
import Node, {Precedence} from './Node';
import Type from './Type';

interface TypevarArgumentable {
	type: Type,
	isParam?: boolean,
	guess?: string,
	name: string,
	doc?: string,
	tex?: string
}

export default class Typevar extends Node {
	public readonly _type = 'typevar';

	public readonly isParam: boolean;
	public readonly guess: string;
	public readonly type: Type;
	public readonly name: string;

	constructor ({type, isParam, guess, name, doc, tex}: TypevarArgumentable, scope?: Scope) {
		super(scope);

		this.doc = doc;
		this.tex = tex;

		this.isParam = !!isParam;
		this.guess = guess || null;

		type = type as Type;

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
}