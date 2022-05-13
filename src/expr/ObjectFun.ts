import Expr from "./Expr";
import Fun from "./Fun";

export default class ObjectFun extends Fun {
	
	constructor ({decoration, rettype, name, params, expr}: ObjectFunArgumentType, trace: StackTrace) {
		super({decoration, rettype, name, params, expr}, trace);
	}

	public override isExpandable(context: ExecutionContext): boolean {
		return this.expr
			&& this.decoration instanceof FunctionalMacroDecoration
			&& (!this.decoration.sealed || context.canUse(this));
	}

	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		if (!this.name) {
			return this.unnamedToTeXString(prec, root);
		}

		if (!root)
			return `\\href{#def-${this.name}}{${TeXUtils.makeTeXName(this.name)}}`;
	
		if (!this.expr)
			return this.funcallToTeXString(this.params, prec);
	
		return this.funcallToTeXString(this.params, Precedence.COLONEQQ)
				+ `\\coloneqq ${this.expr.toTeXString(Precedence.COLONEQQ)}`;
	}

	public static makeTeX(id: string, args: string[], tex: string, my: Precedence, your: Precedence) {
		args = args || [];
		your = your || Precedence.ZERO;
		
		var ret = tex;

		if (my.shouldPutParentheses(your)) {
			ret = '\\left(' + ret + '\\right)';
		}

		return ret.replace(/#([0-9]+)/g, (match, g1) => {
			return args[g1 * 1 - 1] || `\\texttt{\\textcolor{red}{\\#${g1}}}`;
		}).replace(/<<(.+?)>>/, (_match, g1) => {
			return `\\href{#${id}}{${g1}}`;
		});
	}

	public funcallToTeXString(args: Expr[], prec: Precedence) {
		var argStrings = args.map(arg => {
			return arg.toTeXString(this.decoration.tex ? this.decoration.precedence : Precedence.COMMA);
		});
	
		if (this.decoration.tex) {
			return ObjectFun.makeTeX('def-' + this.name, argStrings, this.decoration.tex, this.decoration.precedence, prec);
		}
	
		return (
			!this.name
				? this.toTeXString(Precedence.ZERO)
				: `\\href{#def-${this.name}}{${TeXUtils.makeTeXName(this.name)}}`
		) + `\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
	}
}

import ExecutionContext from "../ExecutionContext";
import StackTrace from "../StackTrace";
import Parameter from "./Parameter";
import { Type } from "./types";
import Precedence from "../Precedence";
import Calculus from "../Calculus";
import TeXUtils from "../util/TeXUtils";
import FunctionalAtomicDecoration from "../decoration/FunctionalAtomicDecoration";
import FunctionalMacroDecoration from "../decoration/FunctionalMacroDecoration";

interface ObjectFunArgumentType {
	decoration: FunctionalAtomicDecoration | FunctionalMacroDecoration;
	rettype: Type;
	name: string;
	params: Parameter[];
	expr: Expr;
}