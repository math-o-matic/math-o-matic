import Scope from "../Scope";
import MetaType from "./MetaType";
import Node from "./Node";
import ObjectType from "./ObjectType";
import Type from "./Type";

export default abstract class Metaexpr extends Node {
    public readonly type: Type;

    constructor(scope: Scope, doc: string, tex: string, type: Type) {
        super(scope, doc, tex);

        if (!type) throw Node.error('Assertion failed', scope);

        this.type = type;
    }

    public equals(obj: Metaexpr): boolean {
        return this === obj;
    }
}