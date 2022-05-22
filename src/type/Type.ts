export default abstract class Type {

	public readonly _id: number;
	public readonly trace: StackTrace;
	public readonly doc: string;

	constructor (doc: string, trace: StackTrace) {
		this._id = UniversalCounter.next();
		this.doc = doc;
		this.trace = trace;
	}

	/**
	 * Fully resolves the type.
	 */
	public abstract resolve(): Type;

	/**
	 * Resolves until the type becomes a FunctionalType.
	 * Throws error if the type cannot be resolved to a FunctionalType.
	 */
	public abstract resolveToFunctionalType(): FunctionalType;

	public toString() {
		return this.toIndentedString(0);
	}

	public abstract toIndentedString(indent: number): string;

	public abstract toTeXString(root?: boolean): string;

	public abstract isFunctional(): boolean;

	public equals(t: Type): boolean {
		if (this === t) return true;

		if (!(t instanceof Type)) return false;

		if ((this instanceof ConditionalType) != (t instanceof ConditionalType)) {
			return false;
		}

		if (this instanceof ConditionalType && t instanceof ConditionalType) {
			if (this.left.length != t.left.length) return false;

			for (var i = 0; i < this.left.length; i++) {
				if (!this.left[i].equals(t.left[i])) return false;
			}

			return this.right.equals(t.right);
		}

		if (this instanceof SimpleType && this.expr) {
			return this.expr.equals(t);
		}

		if (t instanceof SimpleType && t.expr) {
			return this.equals(t.expr);
		}

		if (this instanceof SimpleType || t instanceof SimpleType) {
			return false;
		}

		if (this instanceof FunctionalType && t instanceof FunctionalType) {
			if (this.from.length != t.from.length) return false;

			for (var i = 0; i < this.from.length; i++) {
				if (!this.from[i].equals(t.from[i])) return false;
			}

			return this.to.equals(t.to);
		}

		throw Error('Unknown type format');
	}
}

import StackTrace from "../StackTrace";
import UniversalCounter from "../util/UniversalCounter";
import { ConditionalType } from "./ConditionalType";
import { FunctionalType } from "./FunctionalType";
import { SimpleType } from "./SimpleType";