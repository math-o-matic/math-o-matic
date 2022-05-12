import Expr from "./Expr";
import Nameable from "./Nameable";

interface $VariableArgumentType {
	name: string;
	expr: Expr;
}

export default class $Variable extends Expr implements Nameable {

	public readonly name: string;
	public readonly expr: Expr;

	constructor ({name, expr}: $VariableArgumentType, trace: StackTrace) {
		super(expr.type, trace);

		if (!name || !expr) {
			throw Expr.error('Assertion failed', trace);
		}

		this.name = name;
		this.expr = expr;
	}
	
	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		return `\\mathtt{${TeXUtils.escapeTeX(this.name)}}`;
	}
}

import StackTrace from "../StackTrace";
import Precedence from "../Precedence";
import TeXUtils from "../TeXUtils";
