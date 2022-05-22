import Type from "./Type";

interface SimpleTypeArgumentType {
	doc: string;
	name: string;
	expr: Type;
}

export class SimpleType extends Type {

	public readonly name: string;
	public readonly expr: Type;

	constructor ({doc, name, expr}: SimpleTypeArgumentType, trace: StackTrace) {
		super(doc, trace);

		if (!name) throw Error('duh');

		this.name = name;
		this.expr = expr;
	}

	public override resolve(): Type {
		return this.expr ? this.expr.resolve() : this;
	}

	public resolveToFunctionalType(): FunctionalType {
		if (!this.expr) {
			throw new Error(`Type ${this} is not functional`);
		}
		
		return this.expr.resolveToFunctionalType();
	}

	public override toIndentedString(indent: number): string {
		return this.name;
	}

	public override toTeXString(root?: boolean): string {
		var name = `\\href{#type-${this.name}}{\\mathsf{${this.name}}}`;

		if (root && this.expr) {
			return name + `\\coloneqq${this.expr.toTeXString()}`;
		}

		return name;
	}

	public override isFunctional(): boolean {
		if (this.expr) return this.expr.isFunctional();

		return false;
	}
}

import StackTrace from "../StackTrace";
import { FunctionalType } from "./FunctionalType";