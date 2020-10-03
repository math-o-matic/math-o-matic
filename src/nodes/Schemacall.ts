import Node, { Precedence } from './Node';
import Typevar from './Typevar';
import MetaType from './MetaType';
import Type from './Type';
import Scope from '../Scope';
import Schema from './Schema';

export default class Schemacall extends Node {
	public readonly _type = 'schemacall';

	public readonly type: Type | MetaType;
	public readonly schema;
	public readonly args;

	constructor ({schema, args}, scope?: Scope) {
		super(scope);

		if (schema.type.isSimple)
			throw this.error(`${schema.name} is not callable`);

		if (!(args instanceof Array) || args.map(e => e instanceof Node).some(e => !e))
			throw this.error('Assertion failed');
			 
		var resolvedType = schema.type.resolve(),
			paramTypes = resolvedType.from,
			argTypes = args.map(e => e.type);

		if (paramTypes.length != argTypes.length)
			throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

		for (var i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(argTypes[i])) {
				throw this.error(`Argument #${i + 1} has illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
			}
		}
		
		this.schema = schema;
		this.type = resolvedType.to;
		this.args = args;
	}

	public isProved(hyps?) {
		hyps = hyps || [];
	
		return super.isProved(hyps) || this.schema.isProved(hyps);
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
	
			if (this.schema.shouldValidate) {
				return [
					`${this.schema.name || `(${this.schema})`}(`,
					args,
					')'
				].join('');
			} else {
				return [
					`${this.schema._type != 'schema' || !this.schema.name ? '(' + this.schema.toIndentedString(indent) + ')' : this.schema.name}(`,
					args,
					')'
				].join('');
			}
		}
		else {
			args = args.join(',\n' + '\t'.repeat(indent + 1));
			
			if (this.schema.shouldValidate) {
				return [
					`${this.schema.name || `(${this.schema.toIndentedString(indent)})`}(`,
					'\t' + args,
					')'
				].join('\n' + '\t'.repeat(indent));
			} else {
				return [
					`${this.schema._type != 'schema' || !this.schema.name ? '(' + this.schema.toIndentedString(indent) + ')' : this.schema.name}(`,
					'\t' + args,
					')'
				].join('\n' + '\t'.repeat(indent));
			}
		}
	}

	public toTeXString(prec?: Precedence, root?: boolean): string {
		if (this.schema.shouldValidate) {
			return (
				this.schema.name
					? `\\href{#schema-${this.schema.proved ? 'p' : 'np'}-${this.schema.name}}{\\textsf{${Node.escapeTeX(this.schema.name)}}}`
					: this.schema.toTeXString(false)
			) + `\\mathord{\\left(${this.args.map(arg => {
				return arg.toTeXString(Node.PREC_COMMA);
			}).join(', ')}\\right)}`;
		}

		if (this.schema instanceof Schema)
			return this.schema.funcallToTeXString(this.args, prec);
		
		var args = this.args.map(arg => {
			return arg.toTeXString(Node.PREC_COMMA);
		});

		return `${!this.schema.name || this.schema._type == 'typevar'
				? this.schema.toTeXString(false)
				: this.schema.name.length == 1
					? Node.escapeTeX(this.schema.name)
					: `\\mathrm{${Node.escapeTeX(this.schema.name)}}`}`
			+ `\\mathord{\\left(${args.join(', ')}\\right)}`;
	}
}