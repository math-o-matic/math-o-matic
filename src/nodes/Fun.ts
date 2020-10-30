import Node, { Precedence } from './Node';
import ObjectType from './ObjectType';
import MetaType from './MetaType';
import ExpressionResolver from '../ExpressionResolver';
import Scope from '../Scope';
import Variable from './Variable';
import $Variable from './$Variable';
import Expr0 from './Expr0';
import Metaexpr from './Metaexpr';
import Nameable from './Nameable';
import Type from './Type';

interface FunArgumentType {
	isSchema: boolean;
	annotations: string[];
	axiomatic?: boolean;
	type?: Type;
	name?: string;
	params?: Variable[];
	def$s?: $Variable[];
	expr?: Metaexpr;
	doc?: string;
	tex?: string;
}

export default class Fun extends Expr0 implements Nameable {

	public readonly isSchema: boolean;
	public readonly annotations: string[];
	public readonly axiomatic: boolean;
	public readonly name: string;
	public readonly params: Variable[];
	public readonly def$s: $Variable[];
	public readonly expr: Metaexpr;
	public readonly proved: boolean;

	/*
	 * name, expr 중 하나 이상 있어야 하고 type, expr 중
	 * 한 개만 있어야 한다.
	 */
	constructor ({doc, tex, isSchema, annotations, axiomatic, type, /* nullable */ name, params, def$s, expr}: FunArgumentType, scope?: Scope) {
		if (!name && !expr)
			throw Node.error('Anonymous fun cannot be primitive', scope);

		if (type && expr)
			throw Node.error('no', scope);

		if (!type && !expr)
			throw Node.error('Cannot guess the type of a primitive fun', scope);

		if (name !== null && typeof name != 'string')
			throw Node.error('Assertion failed', scope);
		
		if (!(params instanceof Array)
				|| params.map(e => e instanceof Variable).some(e => !e))
			throw Node.error('Assertion failed', scope);
		
		if (expr !== null && !(expr instanceof Node))
			throw Node.error('Assertion failed', scope);
		
		var precedence = false;

		if (tex) {
			var parsed = Node.parseTeX(tex);
			precedence = parsed.precedence;
			tex = parsed.code;
		} else {
			tex = null;
		}
		
		super(
			scope, doc, tex,
			type || new (expr.type instanceof ObjectType ? ObjectType : MetaType)({
				functional: true,
				from: params.map(variable => variable.type),
				// @ts-ignore
				to: expr.type
			})
		);

		this.isSchema = isSchema;
		this.annotations = annotations;
		this.precedence = precedence;
		this.axiomatic = axiomatic;
		this.name = name;
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
				'\\mapsto ',
				ExpressionResolver.expandMetaAndFuncalls(this.expr).toTeXString(false),

				(this.shouldConsolidate(prec) ? '\\right)' : '')
			].join('');
		}

		if (!this.isSchema) {
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
		
			return `\\href{#${id}}{\\mathsf{${Node.escapeTeX(this.name)}}}\\mathord{\\left(${this.params.map(e => e.toTeXStringWithId(Node.PREC_COMMA) + (e.guess ? `: \\texttt{@${e.guess}}` : '')).join(', ')}\\right)}:\\\\\\quad`
				+ ExpressionResolver.expandMetaAndFuncalls(this.expr).toTeXString(true);
		}
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