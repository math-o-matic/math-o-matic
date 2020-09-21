import Node, { Precedence } from './Node';
import Type from './Type';
import ExpressionResolver from '../ExpressionResolver';
import Scope from '../Scope';
import Typevar from './Typevar';

interface FunArgumentType {
	name?: string,
	type?: Type,
	params: Typevar[],
	expr?: Node,
	doc?: string,
	tex?: string
}

export default class Fun extends Node {
	public readonly _type = 'fun';

	public readonly shouldValidate = false;
	public readonly name: string;
	public readonly type: Type;
	public readonly params;
	public readonly expr;

	/*
	 * name, expr 중 하나 이상 있어야 하고 type, expr 중
	 * 한 개만 있어야 한다.
	 */
	constructor ({doc, tex, type, name, params, expr}: FunArgumentType, scope?: Scope) {
		super(scope);

		this.doc = doc;

		if (tex) {
			var {precedence, code} = Fun.parseTeX(tex);

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

		type = type as Type;

		if (!(params instanceof Array)
				|| params.map(e => e instanceof Node).some(e => !e))
			throw this.error('Assertion failed');

		if (expr !== null && !(expr instanceof Node))
			throw this.error('Assertion failed');

		this.name = name;
		this.type = type || new Type({
			functional: true,
			from: params.map(typevar => typevar.type),
			to: expr.type
		});
		this.params = params;
		this.expr = expr;
	}

	public isProved(hyps?) {
		hyps = hyps || [];
		
		return super.isProved(hyps);
	}

	public toIndentedString(indent: number, root?: boolean): string {
		if (!this.expr)
			return `ƒ ${this.type.to} ${this.name}(${this.params.join(', ')});`;

		return [
			(this.name ? 'ƒ ' + this.type.to + ' ' + this.name : 'ƒ ')
				+ `(${this.params.join(', ')}) => {`,
			`\t${this.expr.toIndentedString(indent + 1)}`,
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
	
		return `${!this.name
				? this.toTeXString(false)
				: `\\href{#def-${this.name}}{${this.name.length == 1 ? Node.escapeTeX(this.name) : `\\mathrm{${Node.escapeTeX(this.name)}}`}}`}`
			+ `(${args.join(', ')})`;
	}
}