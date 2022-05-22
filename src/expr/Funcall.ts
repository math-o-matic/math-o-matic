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

		if (callee instanceof Variable && callee.isExpandable(context)) {
			return true;
		}

		if (callee instanceof Funcall) {
			return callee.isExpandableOnce(context);
		}

		if (callee instanceof Fun) {
			return true;
		}

		return false;
	}
	
	public expandOnce(context: ExecutionContext): {expanded: Expr, used: Variable[]} {
		if (!this.isExpandableOnce(context)) {
			throw Error('Cannot expand');
		}

		var used: Variable[] = [];

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

		return {
			expanded: callee.call(this.args),
			used
		};
	}

	public override toString() {
		return `${this.fun}(${this.args.join(', ')})`;
	}

	protected override toTeXStringInternal(prec: Precedence, root: boolean): string {
		if (this.fun instanceof Variable) {
			return this.fun.funcallToTeXString(this.args, prec);
		}
		
		var argStrings = this.args.map(arg => {
			return arg.toTeXString(Precedence.COMMA);
		});

		return (
			this.fun.toTeXString(Precedence.ZERO)
		) + `\\mathord{\\left(${argStrings.join(', ')}\\right)}`;
	}
}

import ExecutionContext from '../ExecutionContext';
import StackTrace from '../StackTrace';
import $Variable from './$Variable';
import Fun from './Fun';
import { isNameable } from './Nameable';
import Variable from './Variable';
import Precedence from '../Precedence';import { FunctionalType } from '../type/FunctionalType';

