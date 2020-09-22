import Node, { Precedence } from './Node';
import MetaType from './MetaType';

import ExpressionResolver from '../ExpressionResolver';
import Scope from '../Scope';

export default class Tee extends Node {
	public readonly _type = 'tee';
	public precedence = Node.PREC_COMMA;

	public readonly left;
	public readonly right;
	public readonly type: MetaType;

	constructor ({left, right}, scope?: Scope) {
		super(scope);
		
		if (!(left instanceof Array
				&& left.every(l => ['type', 'metatype'].includes(l.type._type)))) {
			console.log(left);
			throw this.error('Assertion failed');
		}

		if (!['type', 'metatype'].includes(right.type._type)) {
			console.log(right);
			throw this.error('Assertion failed');
		}

		if (right.type.isFunctional) {
			throw this.error('RHS of a rule cannot be a schema');
		}

		// antecedent의 contraction
		// 현재 antecedent를 집합처럼 생각하므로 contraction을 자동으로 한다.
		// antecedent가 집합인지 시퀀스인지는 #14 참조.
		this.left = left.reduce((l, r) => {
			for (var i = 0; i < l.length; i++)
				if (ExpressionResolver.equals(l[i], r)) return l;

			return l.push(r), l;
		}, []);

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