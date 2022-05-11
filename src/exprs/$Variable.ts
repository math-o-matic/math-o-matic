import Counter from "../Counter";
import ExecutionContext from "../ExecutionContext";
import { ProofType } from "../ProofType";
import StackTrace from "../StackTrace";
import Fun from "./Fun";
import Expr, { EqualsPriority } from "./Expr";
import Nameable from "./Nameable";
import Variable from "./Variable";
import Precedence from "./Precedence";

interface $VariableArgumentType {
	name: string;
	expr: Expr;
}

export default class $Variable extends Expr implements Nameable {

	public readonly name: string;
	public readonly expr: Expr;

	constructor ({name, expr}: $VariableArgumentType, trace: StackTrace) {
		super(expr.type, trace);

		if (!name || !expr) {
			throw Expr.error('Assertion failed', trace);
		}

		this.name = name;
		this.expr = expr;
	}

	protected override isProvedInternal(hypotheses: Expr[]): boolean {
		return this.expr.isProved(hypotheses);
	}

	protected override expandInternal(): Expr {
		var expr = this.expr.expand();
		if (expr == this.expr) return this;
		return expr;
	}

	protected override getEqualsPriority(): EqualsPriority {
		return EqualsPriority.FIVE;
	}

	protected override equalsInternal(obj: Expr, context: ExecutionContext): (Fun | Variable)[] | false {
		return this.expr.equals(obj, context);
	}

	protected override getProofInternal(
			hypnumMap: Map<Expr, number>,
			$Map: Map<Expr, number | [number, number]>,
			ctr: Counter): ProofType[] {
		
		if (!$Map.has(this)) {
			throw Error(`${this.name} is not defined`);
		}

		return [{
			_type: 'R',
			ctr: ctr.next(),
			num: $Map.get(this),
			expr: this.expr
		}];
	}

	public override toIndentedString(indent: number, root?: boolean): string {
		return this.name;
	}
	
	public override toTeXString(prec?: Precedence, root?: boolean): string {
		prec = prec || Precedence.INFINITY;
		root = typeof root == 'boolean' ? root : false;

		return `\\mathtt{${Expr.escapeTeX(this.name)}}`;
	}
}