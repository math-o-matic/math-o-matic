import Type from "./Type";

interface FunctionalTypeArgumentType {
	from: Type[];
	to: Type;
}

export class FunctionalType extends Type {

	public readonly from: Type[];
	public readonly to: Type;

	constructor ({from, to}: FunctionalTypeArgumentType, trace: StackTrace) {
		super(null, trace);

		this.from = from;
		this.to = to;
	}

	public override resolve(): FunctionalType {
		return new FunctionalType({
			from: this.from.map(f => f.resolve()),
			to: this.to.resolve()
		}, this.trace);
	}

	public resolveToFunctionalType(): FunctionalType {
		return this;
	}

	public override toIndentedString(indent: number): string {
		return `[${this.from.join(', ')} -> ${this.to}]`;
	}

	public override toTeXString(root?: boolean): string {
		return `\\left[${this.from.map(e => e.toTeXString()).join('\\times ')}`
			+ ` \\to ${this.to.toTeXString()}\\right]`;
	}

	public override isFunctional(): boolean {
		return true;
	}
}

import StackTrace from "../StackTrace";