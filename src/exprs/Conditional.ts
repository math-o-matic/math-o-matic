import Expr from './Expr';

interface ConditionalArgumentType {
	left: Expr[];
	def$s: $Variable[];
	right: Expr;
}

export default class Conditional extends Expr {

	public readonly left: Expr[];
	public readonly def$s: $Variable[];
	public readonly right: Expr;

	constructor ({left, def$s, right}: ConditionalArgumentType, trace: StackTrace) {
		super(new ConditionalType({
			left: left.map(e => e.type),
			right: right.type
		}, trace), trace);

		this.left = left;
		this.def$s = def$s || [];
		this.right = right;
	}

	protected override isProvedInternal(hypotheses: Expr[]): boolean {
		return this.right.isProved(hypotheses.concat(this.left));
	}

	protected override expandInternal(): Expr {
		var left = this.left.map(lef => lef.expand());
		var right = this.right.expand();

		if (left.every((l, i) => l == this.left[i]) && right == this.right) return this;

		return new Conditional({left, def$s: null, right}, this.trace);
	}

	protected override equalsInternal(obj: Expr, context: ExecutionContext): (Fun | Variable)[] | false {
		if (!(obj instanceof Conditional)) {
			throw Error('Assertion failed');
		}

		if (this.left.length != obj.left.length) {
			throw Error('Assertion failed');
		}

		for (var i = 0; i < this.left.length; i++) {
			if (!this.left[i].equals(obj.left[i], context)) return false;
		}

		return this.right.equals(obj.right, context);
	}

	protected override getProofInternal(
			hypnumMap: Map<Expr, number>,
			$Map: Map<Expr, number | [number, number]>,
			ctr: Counter): ProofType[] {
		
		hypnumMap = new Map(hypnumMap);

		var start = ctr.peek() + 1;

		var leftlines: ProofType[] = this.left.map(l => {
			hypnumMap.set(l, ctr.next());
			
			return {
				_type: 'H',
				ctr: ctr.peek(),
				expr: l
			};
		});

		$Map = new Map($Map);

		var $lines = this.def$s.map($ => {
			var lines = $.expr.getProof(hypnumMap, $Map, ctr);
			var $num = lines[lines.length - 1].ctr;
			$Map.set($, $num);
			return lines;
		}).flat(1);

		return [{
			_type: 'T',
			leftlines: leftlines as any,
			rightlines: $lines.concat(this.right.getProof(hypnumMap, $Map, ctr)),
			ctr: [start, ctr.peek()]
		}];
	}

	public override toIndentedString(indent: number, root?: boolean): string {
		if (!this.left.length) {
			return '|- ' + this.right.toIndentedString(indent);
		}
	
		return [
			'\t' + this.left.map(e => e.toIndentedString(indent + 1)).join(',\n' + '\t'.repeat(indent + 1)),
			'|-',
			'\t' + this.right.toIndentedString(indent + 1)
		].join('\n' + '\t'.repeat(indent));
	}
	
	public override toTeXString(prec?: Precedence, root?: boolean): string {
		prec = prec || Precedence.INFINITY;
		root = typeof root == 'boolean' ? root : false;

		var expanded = this.expand() as Conditional;

		var shouldPutParentheses = Precedence.COMMA.shouldPutParentheses(prec);

		return [
			(shouldPutParentheses ? '\\left(' : ''),
			`{${expanded.left.map(e => e.toTeXString(Precedence.COMMA)).join(', ')} \\vdash ${expanded.right.toTeXString(Precedence.COMMA)}}`,
			(shouldPutParentheses ? '\\right)' : '')
		].join('');
	}
}

import Counter from '../Counter';
import ExecutionContext from '../ExecutionContext';
import { ProofType } from '../ProofType';
import StackTrace from '../StackTrace';
import $Variable from './$Variable';
import Fun from './Fun';
import { ConditionalType } from './types';
import Variable from './Variable';
import Precedence from './Precedence';