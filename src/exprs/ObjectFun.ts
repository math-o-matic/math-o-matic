import Fun from "./Fun";

export default class ObjectFun extends Fun {

	public readonly sealed: boolean;
	
	constructor ({doc, precedence, tex, sealed, rettype, name, params, expr}: ObjectFunArgumentType, trace: StackTrace) {
		super({doc, precedence, tex, rettype, name, params, expr}, trace);

		if (sealed && !expr) {
			throw Expr.error('Cannot seal a primitive fun', trace);
		}

		this.sealed = sealed;
	}

	public override substitute(map: Map<Variable, Expr>): Expr {
		if (!this.expr) return this;

		// 이름이 있는 것은 치환될 것을 갖지 않아야 한다.
		if (this.name) return this;

		if (this.params.some(p => map.has(p))) {
			map = new Map(map);

			// (λx.t)[x := r] = λx.t
			this.params.forEach(p => {
				if (map.has(p)) {
					map.delete(p);
				}
			});
		}

		var expr = this.expr.substitute(map);
		if (expr == this.expr) return this;

		return new ObjectFun({
			doc: null,
			precedence: Precedence.ZERO,
			tex: null,
			sealed: this.sealed,
			rettype: null,
			name: null,
			params: this.params,
			expr
		}, this.trace);
	}

	protected override expandInternal(): Expr {
		if (!this.expr) return this;
		if (this.name) return this;

		var expr = this.expr.expand();
		if (expr == this.expr) return this;

		return new ObjectFun({
			doc: null,
			precedence: Precedence.ZERO,
			tex: null,
			sealed: this.sealed,
			rettype: null,
			name: null,
			params: this.params,
			expr
		}, this.trace);
	}

	public override isCallable(context: ExecutionContext): boolean {
		return this.expr && (!this.sealed || context.canUse(this));
	}

	public override toIndentedString(indent: number, root?: boolean): string {
		if (this.name) return this.name;
		
		return [
			`ƒ ${this.name || ''}(${this.params.map(p => p.toIndentedString(indent)).join(', ')}) => {`,
			'\t' + this.expr.toIndentedString(indent + 1),
			'}'
		].join('\n' + '\t'.repeat(indent));
	}

	public override toTeXString(prec?: Precedence, root?: boolean): string {
		prec = prec || Precedence.INFINITY;
		root = typeof root == 'boolean' ? root : false;

		if (!this.name) {
			var shouldPutParentheses = Precedence.FUNEXPR.shouldPutParentheses(prec);
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

		if (!root)
			return `\\href{#def-${this.name}}{${Expr.makeTeXName(this.name)}}`;
	
		if (!this.expr)
			return this.funcallToTeXString(this.params, prec);
	
		return this.funcallToTeXString(this.params, Precedence.COLONEQQ)
				+ `\\coloneqq ${this.expr.toTeXString(Precedence.COLONEQQ)}`;
	}

	public static makeTeX(id: string, args: string[], tex: string, my: Precedence, your: Precedence) {
		args = args || [];
		your = your || Precedence.ZERO;
		
		var ret = tex;

		if (my.shouldPutParentheses(your)) {
			ret = '\\left(' + ret + '\\right)';
		}

		return ret.replace(/#([0-9]+)/g, (match, g1) => {
			return args[g1 * 1 - 1] || `\\texttt{\\textcolor{red}{\\#${g1}}}`;
		}).replace(/<<(.+?)>>/, (_match, g1) => {
			return `\\href{#${id}}{${g1}}`;
		});
	}

	public funcallToTeXString(args: Expr[], prec: Precedence) {
		var argStrings = args.map(arg => {
			return arg.toTeXString(this.tex ? this.precedence : Precedence.COMMA);
		});
	
		if (this.tex) {
			return ObjectFun.makeTeX('def-' + this.name, argStrings, this.tex, this.precedence, prec);
		}
	
		return (
			!this.name
				? this.toTeXString(Precedence.ZERO)
				: `\\href{#def-${this.name}}{${Expr.makeTeXName(this.name)}}`
		) + `\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
	}
}

import ExecutionContext from "../ExecutionContext";
import StackTrace from "../StackTrace";
import Expr from "./Expr";
import Variable from "./Variable";
import Parameter from "./Parameter";
import { Type } from "./types";
import Precedence from "./Precedence";

interface ObjectFunArgumentType {
	doc: string;
	precedence: Precedence;
	tex: string;
	sealed: boolean;
	rettype: Type;
	name: string;
	params: Parameter[];
	expr: Expr;
}