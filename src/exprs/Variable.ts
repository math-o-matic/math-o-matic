import Counter from '../Counter';
import ExecutionContext from '../ExecutionContext';
import { ProofType } from '../ProofType';
import StackTrace from '../StackTrace';
import Fun from './Fun';
import Expr, { EqualsPriority, Precedence } from './Expr';
import Nameable from './Nameable';

interface VariableArgumentType {
	doc?: string;
	tex?: string;
	sealed: boolean;
	type: Type;
	name: string;
	expr: Expr;
}

export default class Variable extends Expr implements Nameable {

	public readonly doc: string;
	public readonly tex: string;
	public readonly sealed: boolean;
	public readonly type: Type;
	public readonly name: string;
	public readonly expr: Expr | null;

	constructor ({doc, tex, sealed, type, name, expr}: VariableArgumentType, trace: StackTrace) {
		super(type, trace);
		
		if (typeof name != 'string')
			throw Expr.error('Assertion failed', trace);
		
		if (sealed && !expr) {
			throw Expr.error('Cannot seal a primitive fun', trace);
		}

		if (expr && !type.equals(expr.type)) {
			throw Expr.error(`Expression type ${expr.type} failed to match the type ${type} of variable ${name}`, trace);
		}

		this.doc = doc;
		this.tex = tex;
		this.sealed = sealed;
		this.name = name;
		this.expr = expr;
	}

	protected override isProvedInternal(hypotheses: Expr[]): boolean {
		return false;
	}

	public override substitute(map: Map<Variable, Expr>): Expr {
		if (map.has(this)) return map.get(this);

		// 매크로 변수는 스코프 밖에서 보이지 않으므로 치환될 것을 갖지 않는다는
		// 생각이 들어 있다.
		if (this.expr) {
			return this;
		}

		return this;
	}

	protected override expandInternal(): Expr {
		return this;
	}

	protected override getEqualsPriority(context: ExecutionContext): EqualsPriority {
		return this.expr && (!this.sealed || context.canUse(this))
			? EqualsPriority.FOUR
			: EqualsPriority.ZERO;
	}

	protected override equalsInternal(obj: Expr, context: ExecutionContext): (Fun | Variable)[] | false {
		if (!this.expr) return false;

		if (!this.sealed || context.canUse(this)) {
			var tmp = this.expr.equals(obj, context);
			if (!tmp) return tmp;
			return tmp.push(this), tmp;
		}

		return false;
	}

	protected override getProofInternal(
			hypnumMap: Map<Expr, number>,
			$Map: Map<Expr, number | [number, number]>,
			ctr: Counter): ProofType[] {
		
		return [{
			_type: 'NP',
			ctr: ctr.next(),
			expr: this
		}];
	}

	// pr f
	public toSimpleString() {
		return this.type.toString() + ' ' + this.name;
	}

	public override toIndentedString(indent: number, root?: boolean): string {
		return `${root ? this.type + ' ' : ''}${this.name}<${this._id}>`;
	}

	public override toTeXString(prec?: Precedence, root?: boolean): string {
		var id = this instanceof Parameter ? `id-${this._id}` : `def-${this.name}`;

		var tex = this.tex || Expr.makeTeXName(this.name);
		
		var expr = root && this.expr
			? `\\coloneqq ${this.expr.toTeXString(Expr.PREC_COLONEQQ)}`
			: '';
		
		return `\\href{#${id}}{${tex}}${expr}`;
	}
}

import Parameter from './Parameter';
import { Type } from './types';
