import Scope from "../Scope";
import Expr0 from "./Expr0";
import Node from "./Node";
import Type from "./Type";
import Variable from "./Variable";

export default abstract class Metaexpr extends Node {
	public readonly type: Type;

	constructor(scope: Scope, doc: string, tex: string, type: Type) {
		super(scope, doc, tex);

		if (!type) throw Node.error('Assertion failed', scope);

		this.type = type;
	}

	public abstract substitute(map: Map<Variable, Expr0>): Metaexpr;

	public equals(obj: Metaexpr): boolean {
		return this === obj;
	}
}