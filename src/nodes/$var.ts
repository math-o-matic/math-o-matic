import { Metaexpr } from "../ExpressionResolver";
import Scope from "../Scope";
import MetaType from "./MetaType";
import Node, { Precedence } from "./Node";
import Type from "./Type";

interface $varInput {
    name: string;
    expr: Metaexpr;
}

export default class $var extends Node {

    public readonly type: Type | MetaType;
    public readonly name: string;
    public readonly expr: Metaexpr;

    constructor({name, expr}: $varInput, scope?: Scope) {
        super(scope);

        if (!name || !expr) {
            throw this.error('Assertion failed');
        }

        this.type = expr.type;
        this.name = name;
        this.expr = expr;
    }

    public toIndentedString(indent: number, root?: boolean): string {
        throw this.error("Method not implemented.");
    }
    
    public toTeXString(prec?: Precedence, root?: boolean): string {
        throw this.error("Method not implemented.");
    }

}