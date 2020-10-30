import Scope from "../Scope";
import MetaType from "./MetaType";
import Node from "./Node";
import Type from "./Type";

export default abstract class Metaexpr extends Node {
    public type: Type | MetaType;

    constructor(scope: Scope, type: Type | MetaType) {
        super(scope);

        if (!type) throw Node.error('Assertion failed', scope);

        this.type = type;
    }

    public equals(obj: Metaexpr): boolean {
        return this === obj;
    }
}