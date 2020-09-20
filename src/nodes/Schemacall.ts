import Node, { Precedence } from './Node';
import Typevar from './Typevar';

import ExpressionResolver from '../ExpressionResolver';
import MetaType from './MetaType';
import Type from './Type';
import Scope from '../Scope';

export default class Schemacall extends Node {
	public readonly _type = 'schemacall';

	public readonly schema;
	public readonly args;
	public readonly type: Type | MetaType;
	public readonly expanded;

	constructor ({schema, args}, scope?: Scope) {
		super(scope);

		if (!schema) {
			throw this.error('Assertion failed');
		}

		if (!(args instanceof Array))
			throw this.error('Assertion failed');
		
		this.schema = schema;
		this.args = args;

		var paramTypes = schema.type.from,
			argTypes = args.map(e => e.type);

		if (paramTypes.length != argTypes.length)
			throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

		for (var i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(argTypes[i]))
				throw this.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
		}

		this.type = schema.type.to;

		this.expanded = ExpressionResolver.expandMetaAndFuncalls(this);
	}

	public isProved(hyps?) {
		hyps = hyps || [];
	
		return Node.prototype.isProved.call(this, hyps)
			|| this.schema.isProved(hyps);
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
				`${this.schema.name || `(${this.schema})`}(`,
				args,
				')'
			].join('');
		}
		else {
			args = args.join(',\n' + '\t'.repeat(indent + 1));
	
			return [
				`${this.schema.name || `(${this.schema.toIndentedString(indent)})`}(`,
				'\t' + args,
				')'
			].join('\n' + '\t'.repeat(indent));
		}
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		return (
			this.schema.name
				? `\\href{#schema-${this.schema.proved ? 'p' : 'np'}-${this.schema.name}}{\\textsf{${Node.escapeTeX(this.schema.name)}}}`
				: this.schema.toTeXString(false)
		) + `(${this.args.map(e => e.toTeXString(Node.PREC_COMMA)).join(', ')})`;
	}
}