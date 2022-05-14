import Expr from './Expr';

interface FuncallArgumentType {
	fun: Expr;
	args: Expr[];
}

export default class Funcall extends Expr {
	
	public readonly fun: Expr;
	public readonly args: Expr[];

	constructor ({fun, args}: FuncallArgumentType, trace: StackTrace) {
		if (!fun.type.isFunctional()) {
			var name = isNameable(fun) ? fun.name : '<anonymous>';
			throw Expr.error(`${name} is not callable`, trace);
		}

		if (!(args instanceof Array) || args.map(e => e instanceof Expr).some(e => !e))
			throw Expr.error('Assertion failed', trace);
			 
		var resolvedType = fun.type.resolve() as FunctionalType,
			paramTypes = resolvedType.from,
			argTypes = args.map(e => e.type);

		if (paramTypes.length != argTypes.length)
			throw Expr.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`, trace);

		for (var i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(argTypes[i])) {
				throw Expr.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`, trace);
			}
		}

		super(resolvedType.to, trace);
		
		this.fun = fun;
		this.args = args;
	}

	public isExpandableOnce(context: ExecutionContext): boolean {
		var callee: Expr = this.fun;

		while (callee instanceof $Variable) {
			callee = callee.expr;
		}

		if (callee instanceof Variable && callee.expr) {
			return true;
		}

		if (callee instanceof Funcall) {
			return callee.isExpandableOnce(context);
		}

		if (!(callee instanceof Fun)) return false;

		return callee.isExpandable(context);
	}
	
	public expandOnce(context: ExecutionContext): {expanded: Expr, used: (Fun | Variable)[]} {
		if (!this.isExpandableOnce(context)) {
			throw Error('Cannot expand');
		}

		var used: (Fun | Variable)[] = [];

		var callee: Expr = this.fun;

		while (callee instanceof $Variable) {
			callee = callee.expr;
		}

		if (callee instanceof Variable && callee.expr) {
			used.push(callee);

			return {
				expanded: new Funcall({
					fun: callee.expr,
					args: this.args
				}, this.trace),
				used
			};
		}

		if (callee instanceof Funcall) {
			var calleeExpanded = callee.expandOnce(context);
			used.push(...calleeExpanded.used);
			return {
				expanded: new Funcall({
					fun: calleeExpanded.expanded,
					args: this.args
				}, this.trace),
				used
			};
		}

		if (!(callee instanceof Fun)) {
			throw Error('Something\'s wrong');
		}

		if (callee.name) used.push(callee);

		return {
			expanded: callee.call(this.args),
			used
		};
	}

	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		if (this.fun instanceof Fun) {
			if (this.fun.decoration instanceof SchemaDecoration) {
				return (
					this.fun.name
						? `\\href{#def-${this.fun.name}}{\\htmlData{proved=${Calculus.isProved(this.fun) ? 'p' : 'np'}}{\\textsf{${TeXUtils.escapeTeX(this.fun.name)}}}}`
						: this.fun.toTeXString(Precedence.ZERO)
				) + `\\mathord{\\left(${this.args.map(arg => {
					return arg.toTeXString(Precedence.COMMA);
				}).join(', ')}\\right)}`;
			}
	
			return this.fun.funcallToTeXString(this.args, prec);
		}
		
		var args = this.args.map(arg => {
			return arg.toTeXString(Precedence.COMMA);
		});

		return (
			!(isNameable(this.fun) && this.fun.name) || this.fun instanceof Variable
				? this.fun.toTeXString(Precedence.ZERO)
				: TeXUtils.makeTeXName(this.fun.name)
		) + `\\mathord{\\left(${args.join(', ')}\\right)}`;
	}
}

import ExecutionContext from '../ExecutionContext';
import StackTrace from '../StackTrace';
import $Variable from './$Variable';
import Fun from './Fun';
import { isNameable } from './Nameable';
import Variable from './Variable';
import { FunctionalType } from './types';import Precedence from '../Precedence';
import TeXUtils from '../util/TeXUtils';
import Calculus from '../Calculus';
import SchemaDecoration from '../decoration/SchemaDecoration';

