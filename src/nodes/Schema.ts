import Node, { Precedence } from './Node';
import Type from './Type';
import MetaType from './MetaType';

import ExpressionResolver from '../ExpressionResolver';
import Scope from '../Scope';
import Typevar from './Typevar';

interface SchemaArgumentType {
	axiomatic: boolean,
	name?: string,
	native?: object,
	params?: Typevar[],
	expr?: Node,
	doc?: string
}

export default class Schema extends Node {
	public readonly _type = 'schema';

	public readonly shouldValidate = true;
	public readonly axiomatic: boolean;
	public readonly name: string;
	public readonly native;
	public readonly params;
	public readonly expr;
	public readonly type: Type | MetaType;
	public readonly proved: boolean;

	constructor ({axiomatic, /* nullable */ name, native, params, expr, doc}: SchemaArgumentType, scope?: Scope) {
		super(scope);

		this.doc = doc;

		if (typeof axiomatic != 'boolean') {
			throw this.error('Assertion failed');
		}

		if (name !== null && typeof name != 'string')
			throw this.error('Assertion failed');

		if (!native && !(expr.type instanceof Type || expr.type instanceof MetaType)) {
			throw this.error('Assertion failed');
		}

		this.axiomatic = axiomatic;
		this.name = name;

		if (native) {
			this.native = native;
			this.expr = null;
			this.type = null;
		} else {
			if (!(params instanceof Array)
					|| params.map(e => e instanceof Typevar).some(e => !e))
				throw this.error('Assertion failed');

			this.params = params;
			this.expr = expr;
			this.type = new (expr.type instanceof Type ? Type : MetaType)({
				functional: true,
				from: params.map(typevar => typevar.type),
				to: expr.type
			});
		}

		this.proved = this.isProved();
	}

	public isProved(hyps?) {
		hyps = hyps || [];
		
		return this.proved
			|| !this.native && super.isProved(hyps)
			|| this.axiomatic
			|| this.expr && this.expr.isProved(hyps);
	}

	public toIndentedString(indent: number, root?: boolean): string {
		if (this.native)
			return `∫ ${this.name} <native>`;

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
					? this.params[0].toTeXString()
					: `\\left(${this.params.map(e => e.toTeXString(Node.PREC_COMMA)).join(', ')}\\right)`
				),
				`\\mapsto ${this.expr.toTeXString(false)}`,
				(this.shouldConsolidate(prec) ? '\\right)' : '')
			].join('');
		}
	
		var id = `schema-${this.proved ? 'p' : 'np'}-${this.name}`;
	
		if (!root)
			return `\\href{#${id}}\\mathsf{${Node.escapeTeX(this.name)}}`;
	
		if (this.native)
			return `\\href{#${id}}{\\mathsf{${Node.escapeTeX(this.name)}}}`
				+ '\\ (\\textrm{native})';
	
		return `\\href{#${id}}{\\mathsf{${Node.escapeTeX(this.name)}}}(${this.params.map(e => e.toTeXString(Node.PREC_COMMA) + (e.guess ? `: \\texttt{@${e.guess}}` : '')).join(', ')}):`
					+ '\\\\\\quad' + ExpressionResolver.expandMetaAndFuncalls(this.expr).toTeXString(true);
	}
}