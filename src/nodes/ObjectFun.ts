import ExpressionResolver from "../ExpressionResolver";
import Scope from "../Scope";
import $Variable from "./$Variable";
import Fun from "./Fun";
import Metaexpr from "./Metaexpr";
import Node, { Precedence } from "./Node";
import Type from "./Type";
import Variable from "./Variable";

interface ObjectFunArgumentType {
	annotations: string[];
	type?: Type;
	name?: string;
	params?: Variable[];
	expr?: Metaexpr;
	doc?: string;
	tex?: string;
}

export default class ObjectFun extends Fun {
	
	constructor ({doc, tex, annotations, type, /* nullable */ name, params, expr}: ObjectFunArgumentType, scope?: Scope) {
		super({doc, tex, annotations, type, name, params, expr}, scope);
	}

	public toIndentedString(indent: number, root?: boolean): string {
		return [
			`ƒ ${this.name || ''}(${this.params.map(p => p.toIndentedString(indent)).join(', ')}) => {`,
			'\t' + this.expr.toIndentedString(indent + 1),
			'}'
		].join('\n' + '\t'.repeat(indent));
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		if (!this.name) {
			this.precedence = Node.PREC_FUNEXPR;
			return [
				(this.shouldConsolidate(prec) ? '\\left(' : ''),

				(
					this.params.length == 1
					? this.params[0].toTeXString(false)
					: `\\left(${this.params.map(e => e.toTeXString(Node.PREC_COMMA)).join(', ')}\\right)`
				),
				'\\mapsto ',
				ExpressionResolver.expandMetaAndFuncalls(this.expr).toTeXString(false),

				(this.shouldConsolidate(prec) ? '\\right)' : '')
			].join('');
		}

		if (!root)
			return `\\href{#def-${this.name}}\\mathrm{${Node.escapeTeX(this.name)}}`;
	
		if (!this.expr)
			return this.funcallToTeXString(this.params, prec);
	
		return this.funcallToTeXString(this.params, Node.PREC_COLONEQQ)
				+ `\\coloneqq ${this.expr.toTeXString(Node.PREC_COLONEQQ)}`;
	}

	public funcallToTeXString(args, prec) {
		args = args.map(arg => {
			return arg.toTeXString(this.tex ? this.precedence : Node.PREC_COMMA);
		});
	
		if (this.tex) {
			return this.makeTeX('def-' + this.name, args, prec);
		}
	
		return (
			!this.name
				? this.toTeXString(false)
				: `\\href{#def-${this.name}}{${this.name.length == 1 ? Node.escapeTeX(this.name) : `\\mathrm{${Node.escapeTeX(this.name)}}`}}`
		) + `\\mathord{\\left(${args.join(', ')}\\right)}`;
	}
}