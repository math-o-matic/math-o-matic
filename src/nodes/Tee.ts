import Node, { Precedence } from './Node';
import MetaType from './MetaType';

import ExpressionResolver, { Metaexpr } from '../ExpressionResolver';
import Scope from '../Scope';
import $var from './$var';
import Type from './Type';

interface TeeInput {
	left: Metaexpr[];
	def$s?: $var[];
	right: Metaexpr;
}

export default class Tee extends Node {
	public precedence = Node.PREC_COMMA;

	public readonly left;
	public readonly def$s: $var[];
	public readonly right;
	public readonly type: MetaType;

	constructor ({left, def$s, right}: TeeInput, scope?: Scope) {
		super(scope);
		
		if (!(left instanceof Array
				&& left.every(l => {
					return l.type instanceof Type
						|| l.type instanceof MetaType;
				}))) {
			console.log(left);
			throw this.error('Assertion failed');
		}

		if (def$s && !(def$s instanceof Array && def$s.every($ => $ instanceof $var)))
			throw this.error('Assertion failed');

		if (!(right.type instanceof Type || right.type instanceof MetaType)) {
			console.log(right);
			throw this.error('Assertion failed');
		}

		if (right.type.isFunctional) {
			throw this.error('RHS of a rule cannot be a schema');
		}

		this.left = left;
		this.def$s = def$s || [];
		this.right = right;
		this.type = new MetaType({
			functional: false,
			left: left.map(e => e.type),
			right: right.type
		});
	}

	public isProved(hyps?) {
		hyps = hyps || [];
	
		return super.isProved(hyps) || this.right.isProved(hyps.concat(this.left));
	}

	public toIndentedString(indent: number, root?: boolean): string {
		if (!this.left.length) {
			return '|- ' + this.right.toIndentedString(indent);
		}
	
		return [
			'\t' + this.left.map(e => e.toIndentedString(indent + 1)).join(',\n' + '\t'.repeat(indent + 1)),
			'|-',
			'\t' + this.right.toIndentedString(indent + 1)
		].join('\n' + '\t'.repeat(indent));
	}
	
	public toTeXString(prec?: Precedence, root?: boolean): string {
		var expanded = ExpressionResolver.expandMetaAndFuncalls(this);

		return [
			(this.shouldConsolidate(prec) ? '\\left(' : ''),
			`{${expanded.left.map(e => e.toTeXString(Node.PREC_COMMA)).join(', ')} \\vdash ${expanded.right.toTeXString(Node.PREC_COMMA)}}`,
			(this.shouldConsolidate(prec) ? '\\right)' : '')
		].join('');
	}
}