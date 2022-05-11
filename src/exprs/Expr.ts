/**
 * 우리의 형식 언어에 포함되는 람다 표현식.
 */
export default abstract class Expr {
	
	public readonly _id: number;
	public readonly trace: StackTrace;
	public readonly type: Type;

	constructor (type: Type, trace: StackTrace) {
		if (!type || !trace) throw Expr.error('Assertion failed', trace);

		this._id = UniversalCounter.next();
		this.type = type;
		this.trace = trace;
	}
	
	public abstract toTeXString(prec?: Precedence, root?: boolean): string;

	public error(message: string | InterpolativeString) {
		return Expr.error(message, this.trace);
	}

	public static error(message: string | InterpolativeString, trace: StackTrace) {
		if (trace) {
			return trace.error(message);
		} else {
			if (message instanceof InterpolativeString) {
				return new InterpolativeError(message);
			}
			
			return new Error(message);
		}
	}
}

import StackTrace from "../StackTrace";
import UniversalCounter from "../UniversalCounter";
import Precedence from "../Precedence";
import { Type } from "./types";import InterpolativeString from "../InterpolativeString";
import InterpolativeError from "../InterpolativeError";

