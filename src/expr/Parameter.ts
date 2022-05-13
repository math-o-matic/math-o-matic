import Variable from "./Variable";

interface ParameterArgumentType {
	decoration: SimpleAtomicDecoration;
	type: Type;
	name: string;
	selector: string;
}

export default class Parameter extends Variable {

	public readonly selector: string;

	constructor ({decoration, type, name, selector}: ParameterArgumentType, trace: StackTrace) {
		super({decoration, type, name, expr: null}, trace);

		this.selector = selector;
	}

	public toTeXStringWithId(prec?: Precedence, root?: boolean): string {
		return `\\htmlId{id-${this._id}}{${this.toTeXString(prec, root)}}`;
	}
}

import StackTrace from "../StackTrace";
import Precedence from "../Precedence";
import { Type } from "./types";
import SimpleAtomicDecoration from "../decoration/SimpleAtomicDecoration";
