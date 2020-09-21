import Node, { Precedence } from './Node';
import Typevar from './Typevar';
import Fun from './Fun';
import Scope from '../Scope';
import Type from './Type';

export default class Funcall extends Node {
	public readonly _type = 'funcall';
	
	public readonly fun;
	public readonly type: Type;
	public readonly args;

	constructor ({fun, args}, scope?: Scope) {
		super(scope);

		fun = fun as Typevar | Fun | Funcall;

		if (fun.type.isSimple)
			throw this.error(`${fun.name} is not callable`);

		if (!(args instanceof Array) || args.map(e => e instanceof Node).some(e => !e))
			throw this.error('Assertion failed');

		var resolvedType = fun.type.resolve(),
			paramTypes = resolvedType.from,
			argTypes = args.map(e => e.type);

		if (paramTypes.length != argTypes.length)
			throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

		for (var i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(argTypes[i]))
				throw this.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
		}
		
		this.fun = fun;
		this.type = resolvedType.to;
		this.args = args;
	}

	public isProved(hyps) {
		hyps = hyps || [];
		
		return super.isProved(hyps) || this.fun.isProved(hyps);
	}

	public toIndentedString(indent: number, root?: boolean): string {
		var args = this.args.map(arg => {
			if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
			return arg.toIndentedString(indent + 1);
		});
	
		if (args.join('').length <= 50) {
			args = this.args.map(arg => {
				if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
				return arg.toIndentedString(indent);
			});
	
			args = args.join(', ');
	
			return [
				`${this.fun._type != 'fun' || !this.fun.name ? '(' + this.fun.toIndentedString(indent) + ')' : this.fun.name}(`,
				args,
				')'
			].join('');
		} else {
			args = args.join(',\n' + '\t'.repeat(indent + 1));
	
			return [
				`${this.fun._type != 'fun' || !this.fun.name ? '(' + this.fun.toIndentedString(indent) + ')' : this.fun.name}(`,
				'\t' + args,
				')'
			].join('\n' + '\t'.repeat(indent));
		}
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		if (this.fun instanceof Fun)
			return this.fun.funcallToTeXString(this.args, prec);

		var args = this.args.map(arg => {
			return arg.toTeXString(Node.PREC_COMMA);
		});

		return `${!this.fun.name || this.fun._type == 'typevar'
				? this.fun.toTeXString(false)
				: this.fun.name.length == 1
					? Node.escapeTeX(this.fun.name)
					: `\\mathrm{${Node.escapeTeX(this.fun.name)}}`}`
			+ `(${args.join(', ')})`;
	}
}