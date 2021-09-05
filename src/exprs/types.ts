import StackTrace from "../StackTrace";
import UniversalCounter from "../UniversalCounter";
import Nameable from "./Nameable";

export abstract class Type {

	public readonly _id: number;
	public readonly trace: StackTrace;
	public readonly doc: string;

	constructor (doc: string, trace: StackTrace) {
		this._id = UniversalCounter.next();
		this.doc = doc;
		this.trace = trace;
	}

	public abstract resolve(): Type;

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

	public toIndentedString(indent: number): string {
		return `[${this.left.join(', ')} |- ${this.right}]`;
	}

	public toTeXString(root?: boolean): string {
		throw new Error("Method not implemented.");
	}

	public resolve(): Type {
		return this;
	}

	public isFunctional(): boolean {
		return false;
	}
}

interface SimpleTypeArgumentType {
	doc: string;
	name: string;
	expr: Type;
}

export class SimpleType extends Type implements Nameable {

	public readonly name: string;
	public readonly expr: Type;

	constructor ({doc, name, expr}: SimpleTypeArgumentType, trace: StackTrace) {
		super(doc, trace);

		if (!name) throw Error('duh');

		this.name = name;
		this.expr = expr;
	}

	public resolve(): Type {
		return this.expr ? this.expr.resolve() : this;
	}

	public toIndentedString(indent: number): string {
		return this.name;
	}

	public toTeXString(root?: boolean): string {
		var name = `\\href{#type-${this.name}}{\\mathsf{${this.name}}}`;

		if (root && this.expr) {
			return name + `\\coloneqq${this.expr.toTeXString()}`;
		}

		return name;
	}

	public isFunctional(): boolean {
		if (this.expr) return this.expr.isFunctional();

		return false;
	}
}

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

	public resolve(): FunctionalType {
		return new FunctionalType({
			from: this.from.map(f => f.resolve()),
			to: this.to.resolve()
		}, this.trace);
	}

	public toIndentedString(indent: number): string {
		return `[${this.from.join(', ')} -> ${this.to}]`;
	}

	public toTeXString(root?: boolean): string {
		return `\\left[${this.from.map(e => e.toTeXString()).join('\\times ')}`
			+ ` \\to ${this.to.toTeXString()}\\right]`;
	}

	public isFunctional(): boolean {
		return true;
	}
}