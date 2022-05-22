import Type from "./Type";

interface ConditionalTypeArgumentType {
	left: Type[];
	right: Type;
}

export class ConditionalType extends Type {

	public readonly left: Type[];
	public readonly right: Type;

	constructor ({left, right}: ConditionalTypeArgumentType, trace: StackTrace) {
		super(null, trace);

		if (!left || !right) {
			throw Error('duh');
		}

		this.left = left;
		this.right = right;
	}

	public override toIndentedString(indent: number): string {
		return `[${this.left.join(', ')} |- ${this.right}]`;
	}

	public override toTeXString(root?: boolean): string {
		throw new Error("Method not implemented.");
	}

	public override resolve(): Type {
		return this;
	}

	public resolveToFunctionalType(): FunctionalType {
		throw new Error(`Type ${this} is not functional`);
	}

	public override isFunctional(): boolean {
		return false;
	}
}

import StackTrace from "../StackTrace";
import { FunctionalType } from "./FunctionalType";
