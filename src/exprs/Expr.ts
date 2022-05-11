/**
 * 우리의 형식 언어에 포함되는 람다 표현식.
 */
export default abstract class Expr {
	
	public readonly _id: number;

	public readonly trace: StackTrace;

	public readonly type: Type;

	constructor (type: Type, trace: StackTrace) {
		this._id = UniversalCounter.next();

		if (!type) throw Expr.error('Assertion failed', trace);

		this.type = type;

		this.trace = trace;
	}

	public getProof(
			hypnumMap: Map<Expr, number>,
			$Map: Map<Expr, number | [number, number]>,
			ctr: Counter,
			root: boolean=false): ProofType[] {
		
		if (hypnumMap.has(this)) {
			return [{
				_type: 'R',
				ctr: ctr.next(),
				num: hypnumMap.get(this),
				expr: this
			}];
		}

		if ($Map.has(this)) {
			return [{
				_type: 'R',
				ctr: ctr.next(),
				num: $Map.get(this),
				expr: this
			}];
		}

		return this.getProofInternal(hypnumMap, $Map, ctr, root);
	}

	protected abstract getProofInternal(
			hypnumMap: Map<Expr, number>,
			$Map: Map<Expr, number | [number, number]>,
			ctr: Counter,
			root?: boolean): ProofType[];
	
	public toString() {
		return this.toIndentedString(0);
	}

	public abstract toIndentedString(indent: number, root?: boolean): string;
	public abstract toTeXString(prec?: Precedence, root?: boolean): string;

	public error(message: string) {
		return Expr.error(message, this.trace);
	}

	public static error(message: string, trace: StackTrace) {
		if (trace) {
			return trace.error(message);
		} else {
			return new Error(message);
		}
	}
}

import Counter from "../Counter";
import { ProofType } from "../ProofType";
import StackTrace from "../StackTrace";
import UniversalCounter from "../UniversalCounter";
import Precedence from "../Precedence";
import { Type } from "./types";