import Expr from './Expr';
import Nameable from './Nameable';

interface VariableArgumentType {
	decoration: SimpleAtomicDecoration | SimpleMacroDecoration;
	type: Type;
	name: string;
	expr: Expr;
}

export default class Variable extends Expr implements Nameable {

	public readonly decoration: SimpleAtomicDecoration | SimpleMacroDecoration | FunctionalAtomicDecoration | FunctionalMacroDecoration;
	public readonly name: string;
	public readonly expr: Expr;

	constructor ({decoration, type, name, expr}: VariableArgumentType, trace: StackTrace) {
		super(type, trace);
		
		if (typeof name != 'string')
			throw Expr.error('Assertion failed', trace);

		if (expr && !type.equals(expr.type)) {
			throw Expr.error(`Expression type ${expr.type} failed to match the type ${type} of variable ${name}`, trace);
		}

		if ((decoration instanceof SimpleAtomicDecoration || decoration instanceof FunctionalAtomicDecoration) && expr) {
			throw Expr.error('Unnecessary macro expression', trace);
		}
		
		if ((decoration instanceof SimpleMacroDecoration || decoration instanceof FunctionalMacroDecoration) && !expr) {
			throw Expr.error('Missing macro expression', trace);
		}

		if (decoration instanceof FunctionalMacroDecoration && !(expr instanceof Fun)) {
			throw Expr.error('Assertion failed', trace);
		}

		this.decoration = decoration;
		this.name = name;
		this.expr = expr;

		if (decoration instanceof SchemaDecoration) {
			if (decoration.schemaType == 'theorem') {
				if (!Calculus.isProved(this)) {
					throw Expr.error(`Schema ${name} is marked as a theorem but it is not proved`, trace);
				}
			}
		}
	}

	public isExpandable(context: ExecutionContext): boolean {
		return !!this.expr
			&& (this.decoration instanceof SimpleMacroDecoration
					|| this.decoration instanceof FunctionalMacroDecoration)
			&& (!this.decoration.sealed || context.canUse(this));
	}

	// pr f
	public toSimpleString() {
		return this.type.toString() + ' ' + this.name;
	}

	public override toString() {
		 return this.name;
	}

	public funcallToTeXString(args: Expr[], prec: Precedence): string {
		var hasFunctionalDecoration: boolean;
		var myPrecedence = this.decoration.tex
			&& (hasFunctionalDecoration =
				(this.decoration instanceof FunctionalAtomicDecoration
				|| this.decoration instanceof FunctionalMacroDecoration))
			? this.decoration.precedence : Precedence.COMMA;
		
		var argStrings = args.map(arg => {
			return arg.toTeXString(myPrecedence);
		});
		
		if (!hasFunctionalDecoration) {
			return `${this.toTeXString(Precedence.ZERO)}\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
		}

		if (this.decoration instanceof SchemaDecoration) {
			return `\\href{#def-${this.name}}{\\htmlData{proved=${Calculus.isProved(this) ? 'p' : 'np'}}{\\mathsf{${TeXUtils.escapeTeX(this.name)}}}}\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
		}
	
		if (this.decoration.tex) {
			var id = 'def-' + this.name;
			var ret = this.decoration.tex;

			if (myPrecedence.shouldPutParentheses(prec)) {
				ret = '\\left(' + ret + '\\right)';
			}

			return ret.replace(/#([0-9]+)/g, (match, g1) => {
				return argStrings[g1 * 1 - 1] || `\\texttt{\\textcolor{red}{\\#${g1}}}`;
			}).replace(/<<(.+?)>>/, (_match, g1) => {
				return `\\href{#${id}}{${g1}}`;
			});
		}
	
		return `\\href{#def-${this.name}}{${TeXUtils.makeTeXName(this.name)}}\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
	}

	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		if (this.decoration instanceof SchemaDecoration) {
			if (!this.expr || !(this.expr instanceof Fun)) {
				throw Error('wut');
			}

			var id = 'def-' + this.name,
				proved = Calculus.isProved(this) ? 'p' : 'np';
		
			if (!root)
				return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${TeXUtils.escapeTeX(this.name)}}}}`;
		
			return `\\href{#${id}}{\\htmlData{proved=${proved}}{\\mathsf{${TeXUtils.escapeTeX(this.name)}}}}\\mathord{\\left(${this.expr.params.map(e => e.toTeXStringWithId(Precedence.COMMA) + (e.selector ? `: \\texttt{@${e.selector}}` : '')).join(', ')}\\right)}:\\\\\\quad`
					+ Calculus.expand(this.expr.expr).toTeXString(Precedence.INFINITY);
		}

		if (this.decoration instanceof FunctionalAtomicDecoration
				|| this.decoration instanceof FunctionalMacroDecoration) {
			if (!root)
				return `\\href{#def-${this.name}}{${TeXUtils.makeTeXName(this.name)}}`;

			if (this.decoration instanceof FunctionalAtomicDecoration)
				return this.funcallToTeXString(this.decoration.params, prec);
			
			if (!(this.expr instanceof Fun)) {
				throw Error('wut');
			}
			
			return this.funcallToTeXString(this.expr.params, Precedence.COLONEQQ)
					+ `\\coloneqq ${this.expr.expr.toTeXString(Precedence.COLONEQQ)}`;
		}
		
		var id = this instanceof Parameter ? `id-${this._id}` : `def-${this.name}`;

		var tex = this.decoration.tex || TeXUtils.makeTeXName(this.name);
		
		var expr = root && this.expr
			? `\\coloneqq ${this.expr.toTeXString(Precedence.COLONEQQ)}`
			: '';
		
		return `\\href{#${id}}{${tex}}${expr}`;
	}
}

import Parameter from './Parameter';
import Precedence from '../Precedence';
import StackTrace from '../StackTrace';
import TeXUtils from '../util/TeXUtils';
import ExecutionContext from '../ExecutionContext';
import SimpleAtomicDecoration from '../decoration/SimpleAtomicDecoration';
import SimpleMacroDecoration from '../decoration/SimpleMacroDecoration';
import FunctionalAtomicDecoration from '../decoration/FunctionalAtomicDecoration';
import FunctionalMacroDecoration from '../decoration/FunctionalMacroDecoration';
import SchemaDecoration from '../decoration/SchemaDecoration';
import Calculus from '../Calculus';
import Fun from './Fun';
import Type from '../type/Type';

