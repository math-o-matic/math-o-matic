import { Metaexpr } from "../ExpressionResolver";
import Scope from "../Scope";
import MetaType from "./MetaType";
import Node, { Precedence } from "./Node";
import Type from "./Type";

interface $VariableArgumentType {
    name: string;
    expr: Metaexpr;
}

export default class $Variable extends Node {
    public readonly type: Type | MetaType;
    public readonly name: string;
    public readonly expr: Metaexpr;

    constructor ({name, expr}: $VariableArgumentType, scope?: Scope) {
        super(scope);

        if (!name || !expr) {
            throw this.error('Assertion failed');
        }

        this.type = expr.type;
        this.name = name;
        this.expr = expr;
    }

    public isProved(hyps?): boolean {
		hyps = hyps || [];
		
		return super.isProved(hyps)
			|| this.expr.isProved(hyps);
	}

    public toIndentedString(indent: number, root?: boolean): string {
        return this.name;
    }
    
    public toTeXString(prec?: Precedence, root?: boolean): string {
        return `\\mathtt{${Node.escapeTeX(this.name)}}`;
    }

}