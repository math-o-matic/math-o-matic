import Nameable from './Nameable';
import Expr from './Expr';

export default class Fun extends Expr implements Nameable {

	public readonly decoration: FunctionalAtomicDecoration | FunctionalMacroDecoration;
	public readonly name: string;
	public readonly params: Parameter[];
	public readonly def$s: $Variable[];
	public readonly expr: Expr;

	constructor ({decoration, rettype, name, params, def$s, expr}: FunArgumentType, trace: StackTrace) {
		if (!name && !expr)
			throw Expr.error('Anonymous fun cannot be primitive', trace);

		if (rettype && expr) {
			if (!rettype.equals(expr.type)) {
				throw Expr.error(`Expression type ${expr.type} failed to match the return type ${rettype} of fun ${name}`, trace);
			}
		}

		if (!rettype && !expr) {
			throw Expr.error('Cannot guess the return type of a primitive fun', trace);
		}

		if (decoration instanceof FunctionalMacroDecoration && decoration.sealed && !expr) {
			throw Expr.error('Cannot seal a primitive fun', trace);
		}

		if (decoration instanceof SchemaDecoration) {
			if (!expr) {
				throw Expr.error('wut', trace);
			}

			if (decoration.schemaType != 'schema' && !name) {
				throw Expr.error(`wut`, trace);
			}
		}
		
		super(
			new FunctionalType({
				from: params.map(variable => variable.type),
				to: rettype || expr.type as any
			}, trace),
			trace
		);
		
		this.decoration = decoration;
		this.name = name;
		this.params = params;
		this.def$s = def$s || [];
		this.expr = expr;

		if (decoration instanceof SchemaDecoration) {
			if (decoration.schemaType == 'theorem') {
				if (!Calculus.isProved(this)) {
					throw Expr.error(`Schema ${name} is marked as a theorem but it is not proved`, trace);
				}
			}
		}
	}

	/**
	 * 매개변수의 개수.
	 */
	get length(): number {
		return this.params.length;
	}

	public isExpandable(context: ExecutionContext): boolean {
		return this.expr
			&& this.decoration instanceof FunctionalMacroDecoration
			&& (!this.decoration.sealed || context.canUse(this));
	}

	public call(args: Expr[]): Expr {
		if (!this.expr) {
			throw Error('Cannot call a primitive fun');
		}

		if (this.params.length != args.length) {
			throw Error('Arguments length mismatch');
		}

		for (var i = 0; i < this.params.length; i++) {
			if (!this.params[i].type.equals(args[i].type)) {
				throw Error('Illegal type');
			}
		}

		var map: Map<Variable, Expr> = new Map();

		for (var i = 0; i < this.params.length; i++) {
			map.set(this.params[i], args[i]);
		}

		return Calculus.substitute(this.expr, map);
	}

	protected unnamedToTeXString(prec: Precedence): string {
		if (this.name) {
			throw this.error('I have a name');
		}

		var shouldPutParentheses = Precedence.FUNEXPR.shouldPutParentheses(prec);

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

	public funcallToTeXString(args: Expr[], prec: Precedence): string {
		var argStrings = args.map(arg => {
			return arg.toTeXString(this.decoration.tex ? this.decoration.precedence : Precedence.COMMA);
		});

		if (this.decoration instanceof SchemaDecoration) {
			return (
				this.name
					? `\\href{#def-${this.name}}{\\htmlData{proved=${Calculus.isProved(this) ? 'p' : 'np'}}{\\textsf{${TeXUtils.escapeTeX(this.name)}}}}`
					: this.toTeXString(Precedence.ZERO)
			) + `\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
		}
	
		if (this.decoration.tex) {
			var id = 'def-' + this.name;
			var ret = this.decoration.tex;

			if (this.decoration.precedence.shouldPutParentheses(prec)) {
				ret = '\\left(' + ret + '\\right)';
			}

			return ret.replace(/#([0-9]+)/g, (match, g1) => {
				return argStrings[g1 * 1 - 1] || `\\texttt{\\textcolor{red}{\\#${g1}}}`;
			}).replace(/<<(.+?)>>/, (_match, g1) => {
				return `\\href{#${id}}{${g1}}`;
			});
		}
	
		return (
			!this.name
				? this.toTeXString(Precedence.ZERO)
				: `\\href{#def-${this.name}}{${TeXUtils.makeTeXName(this.name)}}`
		) + `\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
	}

	protected toTeXStringInternal(prec: Precedence, root: boolean): string {
		if (!this.name) {
			return this.unnamedToTeXString(prec);
		}

		if (this.decoration instanceof SchemaDecoration) {
			var id = 'def-' + this.name,
				proved = Calculus.isProved(this) ? 'p' : 'np';
		
			if (!root)
				return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${TeXUtils.escapeTeX(this.name)}}}}`;
		
			return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${TeXUtils.escapeTeX(this.name)}}}}\\mathord{\\left(${this.params.map(e => e.toTeXStringWithId(Precedence.COMMA) + (e.selector ? `: \\texttt{@${e.selector}}` : '')).join(', ')}\\right)}:\\\\\\quad`
					+ Calculus.expand(this.expr).toTeXString(Precedence.INFINITY);
		}

		if (!root)
			return `\\href{#def-${this.name}}{${TeXUtils.makeTeXName(this.name)}}`;
	
		if (!this.expr)
			return this.funcallToTeXString(this.params, prec);
	
		return this.funcallToTeXString(this.params, Precedence.COLONEQQ)
				+ `\\coloneqq ${this.expr.toTeXString(Precedence.COLONEQQ)}`;
	}
}

import Variable from './Variable';
import StackTrace from '../StackTrace';
import ExecutionContext from '../ExecutionContext';
import Parameter from './Parameter';
import { FunctionalType, Type } from './types';
import Calculus from '../Calculus';
import FunctionalAtomicDecoration from '../decoration/FunctionalAtomicDecoration';
import FunctionalMacroDecoration from '../decoration/FunctionalMacroDecoration';
import Precedence from '../Precedence';
import $Variable from './$Variable';
import SchemaDecoration from '../decoration/SchemaDecoration';
import TeXUtils from '../util/TeXUtils';

interface FunArgumentType {
	decoration: FunctionalAtomicDecoration | FunctionalMacroDecoration;
	rettype: Type;
	name: string;
	params: Parameter[];
	def$s: $Variable[];
	expr: Expr;
}