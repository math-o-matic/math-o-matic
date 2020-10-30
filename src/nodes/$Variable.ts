import Scope from "../Scope";
import Metaexpr from "./Metaexpr";
import MetaType from "./MetaType";
import Nameable from "./Nameable";
import Node, { Precedence } from "./Node";
import Type from "./Type";

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

    public toIndentedString(indent: number, root?: boolean): string {
        return this.name;
    }
    
    public toTeXString(prec?: Precedence, root?: boolean): string {
        return `\\mathtt{${Node.escapeTeX(this.name)}}`;
    }
}