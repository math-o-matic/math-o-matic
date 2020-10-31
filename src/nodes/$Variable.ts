import Scope from "../Scope";
import Expr0 from "./Expr0";
import Metaexpr, { EqualsPriority } from "./Metaexpr";
import MetaType from "./MetaType";
import Nameable from "./Nameable";
import Node, { Precedence } from "./Node";
import ObjectType from "./ObjectType";
import Variable from "./Variable";

interface $VariableArgumentType {
	name: string;
	expr: Metaexpr;
}

export default class $Variable extends Metaexpr implements Nameable {

	public readonly name: string;
	public readonly expr: Metaexpr;

	constructor ({name, expr}: $VariableArgumentType, scope?: Scope) {
		super(scope, null, null, expr.type);

		if (!name || !expr) {
			throw Node.error('Assertion failed', scope);
		}

		this.name = name;
		this.expr = expr;
	}

	public isProved(hyps?): boolean {
		hyps = hyps || [];
		
		return super.isProved(hyps)
			|| this.expr.isProved(hyps);
	}

	public substitute(map: Map<Variable, Expr0>): Metaexpr {
		return this.expr.substitute(map);
	}

	public expandMeta(andFuncalls: boolean): Metaexpr {
		return this.expr.expandMeta(andFuncalls);
	}

	protected getEqualsPriority(): EqualsPriority {
		return EqualsPriority.FOUR;
	}

	protected equalsInternal(obj: Metaexpr): boolean {
		return this.expr.equals(obj);
	}

	public toIndentedString(indent: number, root?: boolean): string {
		return this.name;
	}
	
	public toTeXString(prec?: Precedence, root?: boolean): string {
		return `\\mathtt{${Node.escapeTeX(this.name)}}`;
	}
}