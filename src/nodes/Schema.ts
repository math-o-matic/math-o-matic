import Node, { Precedence } from './Node';
import Type from './Type';
import MetaType from './MetaType';

import ExpressionResolver, { Metaexpr } from '../ExpressionResolver';
import Scope from '../Scope';
import Typevar from './Typevar';
import $var from './$var';

interface SchemaArgumentType {
	shouldValidate: boolean;
	axiomatic?: boolean;
	type?: Type | MetaType;
	name?: string;
	params?: (Typevar | Schema)[];
	def$s?: $var[];
	expr?: Metaexpr;
	doc?: string;
	tex?: string;
}

export default class Schema extends Node {
	public readonly _type = 'schema';

	public readonly shouldValidate;
	public readonly axiomatic: boolean;
	public readonly name: string;
	public readonly params;
	public readonly def$s: $var[];
	public readonly expr: Metaexpr;
	public readonly type: Type | MetaType;
	public readonly proved: boolean;

	/*
	 * name, expr 중 하나 이상 있어야 하고 type, expr 중
	 * 한 개만 있어야 한다.
	 */
	constructor ({doc, tex, shouldValidate, axiomatic, type, /* nullable */ name, params, def$s, expr}: SchemaArgumentType, scope?: Scope) {
		super(scope);

		this.doc = doc;
		this.shouldValidate = shouldValidate;

		if (tex) {
			var {precedence, code} = Node.parseTeX(tex);

			this.precedence = precedence;
			this.tex = code;
		} else {
			this.precedence = false;
			this.tex = null;
		}

		if (!name && !expr)
			throw this.error('Anonymous fun cannot be primitive');

		if (type && expr)
			throw this.error('no');

		if (!type && !expr)
			throw this.error('Cannot guess the type of a primitive fun');

		if (name !== null && typeof name != 'string')
			throw this.error('Assertion failed');

		if (expr && !(expr.type instanceof Type || expr.type instanceof MetaType)) {
			throw this.error('Assertion failed');
		}

		this.axiomatic = axiomatic;
		this.name = name;

		if (!(params instanceof Array)
				|| params.map(e => e instanceof Typevar).some(e => !e))
			throw this.error('Assertion failed');
		
		if (expr !== null && !(expr instanceof Node))
			throw this.error('Assertion failed');

		this.type = type || new (expr.type instanceof Type ? Type : MetaType)({
			functional: true,
			from: params.map(typevar => typevar.type),
			to: expr.type
		});

		this.params = params;
		this.def$s = def$s || [];
		this.expr = expr;

		this.proved = this.isProved();
	}

	public isProved(hyps?) {
		hyps = hyps || [];
		
		return this.proved
			|| super.isProved(hyps)
			|| this.axiomatic
			|| this.expr && this.expr.isProved(hyps);
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
				`\\mapsto ${ExpressionResolver.expandMetaAndFuncalls(this.expr).toTeXString(false)}`,
				(this.shouldConsolidate(prec) ? '\\right)' : '')
			].join('');
		}

		if (!this.shouldValidate) {
			if (!root)
				return `\\href{#def-${this.name}}\\mathrm{${Node.escapeTeX(this.name)}}`;
		
			if (!this.expr)
				return this.funcallToTeXString(this.params, prec);
		
			return this.funcallToTeXString(this.params, Node.PREC_COLONEQQ)
					+ `\\coloneqq ${this.expr.toTeXString(Node.PREC_COLONEQQ)}`;
		} else {
			var id = `schema-${this.proved ? 'p' : 'np'}-${this.name}`;
		
			if (!root)
				return `\\href{#${id}}\\mathsf{${Node.escapeTeX(this.name)}}`;
		
			return `\\href{#${id}}{\\mathsf{${Node.escapeTeX(this.name)}}}(${this.params.map(e => e.toTeXString(Node.PREC_COMMA) + (e.guess ? `: \\texttt{@${e.guess}}` : '')).join(', ')}):`
						+ '\\\\\\quad' + ExpressionResolver.expandMetaAndFuncalls(this.expr).toTeXString(true);
		}
	}

	public funcallToTeXString(args, prec) {
		args = args.map(arg => {
			return arg.toTeXString(this.tex ? this.precedence : Node.PREC_COMMA);
		});
	
		if (this.tex) {
			return this.makeTeX('def-' + this.name, args, prec);
		}
	
		return `${!this.name
				? this.toTeXString(false)
				: `\\href{#def-${this.name}}{${this.name.length == 1 ? Node.escapeTeX(this.name) : `\\mathrm{${Node.escapeTeX(this.name)}}`}}`}`
			+ `(${args.join(', ')})`;
	}
}