import Fun from "./Fun";

export type SchemaType = 'axiom' | 'theorem' | 'schema';

export default class Schema extends Fun {

	public readonly schemaType: SchemaType;
	public readonly def$s: $Variable[];
	public readonly context: ExecutionContext;
	private isProvedCache: boolean;

	constructor ({doc, tex, schemaType, name, params, context, def$s, expr}: SchemaArgumentType, trace: StackTrace) {
		if (!expr) {
			throw Expr.error('wut', trace);
		}

		if (schemaType != 'schema' && !name) {
			throw Expr.error(`wut`, trace);
		}

		var precedence = name ? Precedence.ZERO : Precedence.FUNEXPR;

		super({doc, precedence, tex, rettype: null, name, params, expr}, trace);
		
		this.schemaType = schemaType;
		this.def$s = def$s || [];
		this.context = context;

		if (schemaType == 'theorem') {
			if (!this.isProved()) {
				throw Expr.error(`Schema ${name} is marked as a theorem but it is not proved`, trace);
			}
		}
	}
	
	protected override isProvedInternal(hypotheses: Expr[]): boolean {
		if (this.isProvedCache) return true;

		if (hypotheses.length == 0 && typeof this.isProvedCache == 'boolean') {
			return this.isProvedCache;
		}

		var ret = this.schemaType == 'axiom' || this.expr.isProved(hypotheses);
		if (!hypotheses.length) this.isProvedCache = ret;
		return ret;
	}

	protected override expandInternal(): Expr {
		var expr = this.expr.expand();
		if (expr == this.expr) return this;
		
		return new Schema({
			doc: null,
			tex: null,
			schemaType: 'schema',
			name: null,
			params: this.params,
			context: this.context,
			def$s: this.def$s,
			expr: this.expr.expand()
		}, this.trace);
	}

	public override isCallable(_context: ExecutionContext): boolean {
		return true;
	}

	public override toIndentedString(indent: number, root?: boolean): string {
		return [
			`∫ ${this.name || ''}(${this.params.map(p => p.toIndentedString(indent)).join(', ')}) => {`,
			'\t' + this.expr.expand().toIndentedString(indent + 1),
			'}'
		].join('\n' + '\t'.repeat(indent));
	}
	
	public override toTeXString(prec?: Precedence, root?: boolean): string {
		prec = prec || Precedence.INFINITY;
		root = typeof root == 'boolean' ? root : false;

		if (!this.name) {
			var shouldPutParentheses = this.precedence.shouldPutParentheses(prec);

			return [
				(shouldPutParentheses ? '\\left(' : ''),

				(
					this.params.length == 1
					? this.params[0].toTeXString(Precedence.ZERO)
					: `\\left(${this.params.map(e => e.toTeXString(Precedence.COMMA)).join(', ')}\\right)`
				),
				'\\mapsto ',
				this.expr.expand().toTeXString(Precedence.ZERO),

				(shouldPutParentheses ? '\\right)' : '')
			].join('');
		}
		
		var id = 'def-' + this.name,
			proved = this.isProved() ? 'p' : 'np';
	
		if (!root)
			return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${Expr.escapeTeX(this.name)}}}}`;
	
		return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${Expr.escapeTeX(this.name)}}}}\\mathord{\\left(${this.params.map(e => e.toTeXStringWithId(Precedence.COMMA) + (e.selector ? `: \\texttt{@${e.selector}}` : '')).join(', ')}\\right)}:\\\\\\quad`
				+ this.expr.expand().toTeXString(Precedence.INFINITY);
	}
}

import $Variable from "./$Variable";
import Expr from "./Expr";
import Variable from "./Variable";
import StackTrace from "../StackTrace";
import ExecutionContext from "../ExecutionContext";
import Parameter from "./Parameter";
import Precedence from "./Precedence";

interface SchemaArgumentType {
	doc: string;
	tex: string;
	schemaType: SchemaType;
	name: string;
	params: Parameter[];
	context: ExecutionContext;
	def$s: $Variable[];
	expr: Expr;
}