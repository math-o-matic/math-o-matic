import Scope from "../Scope";
import Node from "./Node";

export default abstract class Type extends Node {
    public readonly isFunctional: boolean;
    public readonly isSimple: boolean;
    
    public abstract equals(t: Type): boolean;

    constructor (scope: Scope, doc: string, tex: string, isFunctional: boolean) {
        super(scope, doc, tex);
        this.isFunctional = isFunctional;
        this.isSimple = !isFunctional;
    }

    public abstract resolve(): Type;
}