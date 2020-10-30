import Scope from "../Scope";
import MetaType from "./MetaType";
import Node from "./Node";
import ObjectType from "./ObjectType";

export default abstract class Metaexpr extends Node {
    public readonly type: ObjectType | MetaType;

    constructor(scope: Scope, doc: string, tex: string, type: ObjectType | MetaType) {
        super(scope, doc, tex);

        if (!type) throw Node.error('Assertion failed', scope);

        this.type = type;
    }

    public equals(obj: Metaexpr): boolean {
        return this === obj;
    }
}