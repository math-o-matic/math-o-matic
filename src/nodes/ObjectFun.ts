import ExpressionResolver from "../ExpressionResolver";
import Scope from "../Scope";
import $Variable from "./$Variable";
import Expr0 from "./Expr0";
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
	expr?: Expr0;
	doc?: string;
	tex?: string;
}

export default class ObjectFun extends Fun {
	
	constructor ({doc, tex, annotations, type, /* nullable */ name, params, expr}: ObjectFunArgumentType, scope?: Scope) {
		super({doc, tex, annotations, type, name, params, expr}, scope);
	}

	public substitute(map: Map<Variable, Expr0>): Metaexpr {
		if (!this.expr) return this;

		// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
		if (this.name) return this;

		// 위의 this.name 조건을 지우면 특수한 경우에 이게 발생할지도 모른다.
		if (this.params.some(e => map.has(e)))
			throw Error('Parameter collision');

		return new ObjectFun({
			annotations: this.annotations,
			name: null,
			params: this.params,
			expr: this.expr.substitute(map)
		});
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