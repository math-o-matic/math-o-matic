import Fun from "./Fun";

export type SchemaType = 'axiom' | 'theorem' | 'schema';

export default class Schema extends Fun {

	public readonly schemaType: SchemaType;
	public readonly def$s: $Variable[];
	public readonly context: ExecutionContext;

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
			if (!Calculus.isProved(this)) {
				throw Expr.error(`Schema ${name} is marked as a theorem but it is not proved`, trace);
			}
		}
	}

	public override isCallable(_context: ExecutionContext): boolean {
		return true;
	}
	
	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
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
				Calculus.expand(this.expr).toTeXString(Precedence.ZERO),

				(shouldPutParentheses ? '\\right)' : '')
			].join('');
		}
		
		var id = 'def-' + this.name,
			proved = Calculus.isProved(this) ? 'p' : 'np';
	
		if (!root)
			return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${TeXUtils.escapeTeX(this.name)}}}}`;
	
		return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${TeXUtils.escapeTeX(this.name)}}}}\\mathord{\\left(${this.params.map(e => e.toTeXStringWithId(Precedence.COMMA) + (e.selector ? `: \\texttt{@${e.selector}}` : '')).join(', ')}\\right)}:\\\\\\quad`
				+ Calculus.expand(this.expr).toTeXString(Precedence.INFINITY);
	}
}

import $Variable from "./$Variable";
import Expr from "./Expr";
import StackTrace from "../StackTrace";
import ExecutionContext from "../ExecutionContext";
import Parameter from "./Parameter";
import Precedence from "../Precedence";
import Calculus from "../Calculus";
import TeXUtils from "../TeXUtils";

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