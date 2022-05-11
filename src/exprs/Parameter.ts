import Variable from "./Variable";

interface ParameterArgumentType {
	doc?: string;
	tex?: string;
	type: Type;
	name: string;
	selector: string;
}

export default class Parameter extends Variable {

	public readonly selector: string;

	constructor ({doc, tex, type, name, selector}: ParameterArgumentType, trace: StackTrace) {
		super({doc, tex, sealed: false, type, name, expr: null}, trace);

		this.selector = selector;
	}

	public toTeXStringWithId(prec?: Precedence, root?: boolean): string {
		return `\\htmlId{id-${this._id}}{${this.toTeXString(prec, root)}}`;
	}
}

import StackTrace from "../StackTrace";
import Precedence from "./Precedence";
import { Type } from "./types";