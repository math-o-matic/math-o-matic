import ExpressionResolver from "../ExpressionResolver";
import Scope from "../Scope";
import $Variable from "./$Variable";
import Expr0 from "./Expr0";
import Fun from "./Fun";
import Metaexpr from "./Metaexpr";
import Node, { Precedence } from "./Node";
import Type from "./Type";
import Variable from "./Variable";

interface SchemaArgumentType {
	annotations: string[];
	axiomatic: boolean;
	type?: Type;
	name?: string;
	params?: Variable[];
	def$s: $Variable[];
	expr?: Metaexpr;
	doc?: string;
	tex?: string;
}

export default class Schema extends Fun {

	public readonly axiomatic: boolean;
	public readonly def$s: $Variable[];
	private _isProvedCache: boolean;

	constructor ({doc, tex, annotations, axiomatic, type, /* nullable */ name, params, def$s, expr}: SchemaArgumentType, scope?: Scope) {
		super({doc, tex, annotations, type, name, params, expr}, scope);
		
		this.axiomatic = axiomatic;
		this.def$s = def$s || [];
	}
	
	public isProved(hyps?) {
		if (this._isProvedCache) return true;

		if (!hyps && typeof this._isProvedCache == 'boolean') {
			return this._isProvedCache;
		}

		var cache = !hyps;
		hyps = hyps || [];
		
		var ret = this.axiomatic || super.isProved(hyps);
		if (cache) this._isProvedCache = ret;
		return ret;
	}

	public substitute(map: Map<Variable, Expr0>): Metaexpr {
		if (!this.expr) return this;

		// 이름이 있는 것은 최상단에만 선언되므로 치환되어야 할 것을 포함하지 않으므로 확인하지 않는다는 생각이 들어 있다.
		if (this.name) return this;

		// 위의 this.name 조건을 지우면 특수한 경우에 이게 발생할지도 모른다.
		if (this.params.some(e => map.has(e)))
			throw Error('Parameter collision');

		return new Schema({
			annotations: this.annotations,
			axiomatic: this.axiomatic,
			name: null,
			params: this.params,
			def$s: this.def$s,
			expr: this.expr.substitute(map)
		});
	}

	public toIndentedString(indent: number, root?: boolean): string {
		return [
			`∫ ${this.name || ''}(${this.params.map(p => p.toIndentedString(indent)).join(', ')}) => {`,
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
		
		var id = `schema-${this.isProved() ? 'p' : 'np'}-${this.name}`;
	
		if (!root)
			return `\\href{#${id}}\\mathsf{${Node.escapeTeX(this.name)}}`;
	
		return `\\href{#${id}}{\\mathsf{${Node.escapeTeX(this.name)}}}\\mathord{\\left(${this.params.map(e => e.toTeXStringWithId(Node.PREC_COMMA) + (e.guess ? `: \\texttt{@${e.guess}}` : '')).join(', ')}\\right)}:\\\\\\quad`
				+ ExpressionResolver.expandMetaAndFuncalls(this.expr).toTeXString(true);
	}
}