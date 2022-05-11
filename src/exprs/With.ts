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

	public override toIndentedString(indent: number, root?: boolean): string {
		throw new Error("Method not implemented.");
	}

	public override toTeXString(prec?: Precedence, root?: boolean): string {
		prec = prec || Precedence.INFINITY;
		root = typeof root == 'boolean' ? root : false;
		throw new Error("Method not implemented.");
	}
}

import StackTrace from "../StackTrace";
import $Variable from "./$Variable";
import Variable from "./Variable";
import Precedence from "../Precedence";