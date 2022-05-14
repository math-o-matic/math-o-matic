import Fun from "./Fun";

export type SchemaType = 'axiom' | 'theorem' | 'schema';

export default class Schema extends Fun {

	public override readonly decoration: SchemaDecoration;
	public readonly context: ExecutionContext;

	constructor ({decoration, name, params, context, def$s, expr}: SchemaArgumentType, trace: StackTrace) {
		if (!expr) {
			throw Expr.error('wut', trace);
		}

		if (decoration.schemaType != 'schema' && !name) {
			throw Expr.error(`wut`, trace);
		}

		super({decoration, rettype: null, name, params, def$s, expr}, trace);
		
		this.context = context;

		if (decoration.schemaType == 'theorem') {
			if (!Calculus.isProved(this)) {
				throw Expr.error(`Schema ${name} is marked as a theorem but it is not proved`, trace);
			}
		}
	}

	public override isExpandable(_context: ExecutionContext): boolean {
		return true;
	}
	
	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		if (!this.name) {
			return this.unnamedToTeXString(prec, root);
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
import TeXUtils from "../util/TeXUtils";
import SchemaDecoration from "../decoration/SchemaDecoration";

interface SchemaArgumentType {
	decoration: SchemaDecoration;
	name: string;
	params: Parameter[];
	context: ExecutionContext;
	def$s: $Variable[];
	expr: Expr;
}