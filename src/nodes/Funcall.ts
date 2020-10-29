import Node, { Precedence } from './Node';
import Typevar from './Typevar';
import MetaType from './MetaType';
import Type from './Type';
import Scope from '../Scope';
import Fun from './Fun';
import { Expr0, Metaexpr } from '../ExpressionResolver';

interface FuncallArgumentType {
	fun: Metaexpr;
	args: Expr0[];
}

export default class Funcall extends Node {
	public readonly type: Type | MetaType;
	public readonly fun: Metaexpr;
	public readonly args: Expr0[];

	constructor ({fun, args}: FuncallArgumentType, scope?: Scope) {
		super(scope);

		if (fun.type.isSimple) {
			var name = 'name' in fun ? fun.name : '<anonymous>';
			throw this.error(`${name} is not callable`);
		}

		if (!(args instanceof Array) || args.map(e => e instanceof Node).some(e => !e))
			throw this.error('Assertion failed');
			 
		var resolvedType = fun.type.resolve(),
			paramTypes = resolvedType.from,
			argTypes = args.map(e => e.type);

		if (paramTypes.length != argTypes.length)
			throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

		for (var i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(argTypes[i])) {
				throw this.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
			}
		}
		
		this.fun = fun;
		this.type = resolvedType.to;
		this.args = args;
	}

	public isProved(hyps?) {
		hyps = hyps || [];
	
		return super.isProved(hyps) || this.fun.isProved(hyps);
	}

	public toIndentedString(indent: number, root?: boolean): string {
		var args: any = this.args.map(arg => {
			if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
			return arg.toIndentedString(indent + 1);
		});
	
		if (args.join('').length <= 50) {
			args = this.args.map(arg => {
				if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
				return arg.toIndentedString(indent);
			});
	
			args = args.join(', ');
	
			if ('shouldValidate' in this.fun && this.fun.shouldValidate) {
				return `${this.fun.name || `(${this.fun})`}(${args})`;
			} else {
				return [
					!(this.fun instanceof Fun) || !('name' in this.fun && this.fun.name)
						? '(' + this.fun.toIndentedString(indent) + ')'
						: this.fun.name,
					`(${args})`
				].join('');
			}
		} else {
			args = args.join(',\n' + '\t'.repeat(indent + 1));
			
			if ('shouldValidate' in this.fun && this.fun.shouldValidate) {
				return [
					this.fun.name || `(${this.fun.toIndentedString(indent)})`,
					'(',
					'\t' + args,
					')'
				].join('\n' + '\t'.repeat(indent));
			} else {
				return [
					(
						!(this.fun instanceof Fun) || !('name' in this.fun && this.fun.name)
							? '(' + this.fun.toIndentedString(indent) + ')'
							: this.fun.name
					) + '(',
					'\t' + args,
					')'
				].join('\n' + '\t'.repeat(indent));
			}
		}
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		if ('shouldValidate' in this.fun && this.fun.shouldValidate) {
			return (
				this.fun.name
					? `\\href{#schema-${this.fun.proved ? 'p' : 'np'}-${this.fun.name}}{\\textsf{${Node.escapeTeX(this.fun.name)}}}`
					: this.fun.toTeXString(false)
			) + `\\mathord{\\left(${this.args.map(arg => {
				return arg.toTeXString(Node.PREC_COMMA);
			}).join(', ')}\\right)}`;
		}

		if (this.fun instanceof Fun)
			return this.fun.funcallToTeXString(this.args, prec);
		
		var args = this.args.map(arg => {
			return arg.toTeXString(Node.PREC_COMMA);
		});

		return (
			!('name' in this.fun && this.fun.name) || this.fun instanceof Typevar
				? this.fun.toTeXString(false)
				: this.fun.name.length == 1
					? Node.escapeTeX(this.fun.name)
					: `\\mathrm{${Node.escapeTeX(this.fun.name)}}`
		) + `\\mathord{\\left(${args.join(', ')}\\right)}`;
	}
}