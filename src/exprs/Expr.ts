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

	public isProved(hypotheses?: Expr[]): boolean {
		hypotheses = hypotheses || [];

		for (var i = 0; i < hypotheses.length; i++) {
			if (hypotheses[i] == this) return true;
		}

		return this.isProvedInternal(hypotheses);
	}

	protected abstract isProvedInternal(hypotheses: Expr[]): boolean;

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

	public static escapeTeX(s: string): string {
		return s.replace(/&|%|\$|#|_|{|}|~|\^|\\/g, m => ({
			'&': '\\&', '%': '\\%', '$': '\\$',
			'#': '\\#', '_': '\\_', '{': '\\{',
			'}': '\\}',
			'~': '\\textasciitilde',
			'^': '\\textasciicircum',
			'\\': '\\textbackslash'
		})[m]);
	}

	/**
	 * 'a' -> 'a'
	 * 'alpha1' => '\alpha_1'
	 */
	public static makeTeXName(name: string): string {
		var alphabet = [
			"alpha", "beta", "gamma", "delta",
			"epsilon", "zeta", "eta", "theta",
			"iota", "kappa", "lambda", "mu",
			"nu", "xi", "omicron", "pi",
			"rho", "sigma", "tau", "upsilon",
			"phi", "chi", "psi", "omega"
		];

		var regex = new RegExp(`^(?:([a-z])|(${alphabet.join('|')}))([0-9]*)$`, 'i');
		var match = name.match(regex);

		if (match) {
			var letter = (() => {
				if (match[1]) return match[1];
				
				var capitalize = match[2].charCodeAt(0) <= 'Z'.charCodeAt(0);
				var commandName = match[2].toLowerCase();

				if (capitalize) {
					commandName = commandName[0].toUpperCase() + commandName.substring(1);
				}

				return '\\' + commandName;
			})();

			var subscript = (() => {
				if (!match[3]) return '';
				if (match[3].length == 1) return '_' + match[3];
				return `_{${match[3]}}`;
			})();

			return letter + subscript;
		}

		if (name.length == 1) {
			return Expr.escapeTeX(name);
		}

		return `\\mathrm{${Expr.escapeTeX(name)}}`;
	}
}

import Counter from "../Counter";
import ExecutionContext from "../ExecutionContext";
import { ProofType } from "../ProofType";
import StackTrace from "../StackTrace";
import UniversalCounter from "../UniversalCounter";
import Calculus from "./Calculus";
import Fun from "./Fun";
import Precedence from "./Precedence";
import { Type } from "./types";
import Variable from "./Variable";