import Expr from "./Expr";
import Fun from "./Fun";

export default class ObjectFun extends Fun {
	
	constructor ({decoration, rettype, name, params, expr}: ObjectFunArgumentType, trace: StackTrace) {
		super({decoration, rettype, name, params, def$s: [], expr}, trace);
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

	public funcallToTeXString(args: Expr[], prec: Precedence): string {
		var argStrings = args.map(arg => {
			return arg.toTeXString(this.decoration.tex ? this.decoration.precedence : Precedence.COMMA);
		});
	
		if (this.decoration.tex) {
			var id = 'def-' + this.name;
			var ret = this.decoration.tex;

			if (this.decoration.precedence.shouldPutParentheses(prec)) {
				ret = '\\left(' + ret + '\\right)';
			}

			return ret.replace(/#([0-9]+)/g, (match, g1) => {
				return argStrings[g1 * 1 - 1] || `\\texttt{\\textcolor{red}{\\#${g1}}}`;
			}).replace(/<<(.+?)>>/, (_match, g1) => {
				return `\\href{#${id}}{${g1}}`;
			});
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