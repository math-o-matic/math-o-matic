import Node, { Precedence } from './Node';
import Type from './Type';

export default class MetaType extends Node {
	public readonly _type = 'metatype';

	public readonly isFunctional: boolean;
	public readonly isSimple: boolean;
	public readonly name: string;
	public readonly left;
	public readonly right;
	public readonly from: Type[];
	public readonly to: MetaType;

	constructor (o) {
		super();

		if (typeof o.functional != 'boolean')
			throw this.error('typeof o.functional != \'boolean\'');
		
		this.isFunctional = o.functional;
		this.isSimple = !o.functional;

		if (!o.functional) {
			if (!(o.left instanceof Array))
				throw this.error('left should be an array');

			this.left = o.left;
			this.right = o.right;
		} else {
			if (o.from.some(f => !(f instanceof Type)))
				throw this.error('o.from.some(f => !(f instanceof Type))');
			if (!(o.to instanceof MetaType))
				throw this.error('!(o.to instanceof MetaType)');

			if (o.to.isFunctional)
				throw this.error('Functional metatype in functional metatype is not supported');

			this.from = o.from;
			this.to = o.to;
		}
	}

	public resolve() {
		return this;
	}

	public toIndentedString(indent: number) {
		if (this.isSimple) return `[${this.left.join(', ')} |- ${this.right}]`;

		return `[${this.from.join(', ')} -> ${this.to}]`;
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		throw new Error('Method not implemented.');
	}

	public equals(t) {
		if (!(t instanceof MetaType)) return false;

		if (this.isSimple != t.isSimple) return false;

		if (this.isSimple) {
			if (this.left.length != t.left.length) return false;

			for (let i = 0; i < this.left.length; i++) {
				if (!this.left[i].equals(t.left[i])) return false;
			}

			if (!this.right.equals(t.right)) return false;

			return true;
		}

		if (this.from.length != t.from.length) return false;

		for (let i = 0; i < this.from.length; i++)
			if (!this.from[i].equals(t.from[i])) return false;

		return this.to.equals(t.to);
	}
}