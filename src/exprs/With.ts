import Expr from "./Expr";

interface WithArgumentType {
	variable: Variable;
	def$s: $Variable[];
	expr: Expr;
}

export default class With extends Expr {

	public readonly variable: Variable;
	public readonly def$s: $Variable[];
	public readonly expr: Expr;

	constructor({variable, def$s, expr}: WithArgumentType, trace: StackTrace) {
		super(expr.type, trace);

		this.variable = variable;
		this.def$s = def$s;
		this.expr = expr;
	}

	protected override isProvedInternal(hypotheses: Expr[]): boolean {
		return this.expr.isProved(hypotheses);
	}

	protected override getProofInternal(hypnumMap: Map<Expr, number>, $Map: Map<Expr, number | [number, number]>, ctr: Counter, root?: boolean): ProofType[] {

		$Map = new Map($Map);

		var def: ProofType = {
			_type: 'def',
			ctr: ctr.next(),
			var: this.variable
		};

		var $lines = this.def$s.map($ => {
			var lines = $.expr.getProof(hypnumMap, $Map, ctr);
			var $num = lines[lines.length - 1].ctr;
			$Map.set($, $num);
			return lines;
		}).flat(1);

		return [
			def,
			...$lines,
			...this.expr.getProof(hypnumMap, $Map, ctr)
		];
	}

	public override toIndentedString(indent: number, root?: boolean): string {
		throw new Error("Method not implemented.");
	}

	public override toTeXString(prec?: Precedence, root?: boolean): string {
		prec = prec || Precedence.INFINITY;
		root = typeof root == 'boolean' ? root : false;
		throw new Error("Method not implemented.");
	}
}

import Counter from "../Counter";
import ExecutionContext from "../ExecutionContext";
import { ProofType } from "../ProofType";
import StackTrace from "../StackTrace";
import $Variable from "./$Variable";
import Fun from "./Fun";
import Variable from "./Variable";
import Precedence from "../Precedence";
import Calculus from "../Calculus";