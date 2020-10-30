import Node, { Precedence } from './Node';
import MetaType from './MetaType';
import ExpressionResolver from '../ExpressionResolver';
import Scope from '../Scope';
import $Variable from './$Variable';
import Type from './Type';
import Metaexpr from './Metaexpr';

interface TeeArgumentType {
	left: Metaexpr[];
	def$s?: $Variable[];
	right: Metaexpr;
}

export default class Tee extends Metaexpr {

	public readonly left;
	public readonly def$s: $Variable[];
	public readonly right;

	constructor ({left, def$s, right}: TeeArgumentType, scope?: Scope) {
		if (!(left instanceof Array
				&& left.every(l => {
					return l.type instanceof Type
						|| l.type instanceof MetaType;
				}))) {
			console.log(left);
			throw Node.error('Assertion failed', scope);
		}

		if (def$s && !(def$s instanceof Array && def$s.every($ => $ instanceof $Variable)))
			throw Node.error('Assertion failed', scope);

		if (!(right.type instanceof Type || right.type instanceof MetaType)) {
			console.log(right);
			throw Node.error('Assertion failed', scope);
		}

		if (right.type.isFunctional) {
			throw Node.error('RHS of a rule cannot be a schema', scope);
		}

		super(scope, null, null, new MetaType({
			functional: false,
			left: left.map(e => e.type),
			right: right.type
		}));

		this.left = left;
		this.def$s = def$s || [];
		this.right = right;
		this.precedence = Node.PREC_COMMA;
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