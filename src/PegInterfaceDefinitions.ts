export interface TypedefObject {
    _type: 'typedef';
    doc?: string;
    base: boolean;
    origin?: FtypeObject;
    name: string;
    location: LocationObject;
}

export interface DefvObject {
    _type: 'defv';
    isParam?: boolean;
    guess?: string;
    doc?: string;
    tex?: string;
    type: TypeObject;
    name: string;
    location: LocationObject;
}

export interface DefunObject {
    _type: 'defun';
    doc?: string;
    tex?: string;
    rettype: TypeObject;
    name: string;
    params: DefvObject[];
    expr: Expr0Object;
    location: LocationObject;
}

export type Expr0Object = FuncallObject | FunexprObject | VarObject;

export interface DefschemaObject {
    _type: 'defschema';
    location: LocationObject;
}

export interface DefrulesetObject {
    _type: 'defruleset';
    location: LocationObject;
}

export interface ReductionObject {
    _type: 'reduction';
    location: LocationObject;
}

export interface SchemacallObject {
    _type: 'schemacall';
    location: LocationObject;
}

export interface FuncallObject {
    _type: 'funcall';
    location: LocationObject;
}

export interface FunexprObject {
    _type: 'funexpr';
    params: DefvObject[];
    expr: Expr0Object;
    location: LocationObject;
}

export interface SchemaexprObject {
    _type: 'schemaexpr';
    location: LocationObject;
}

export interface TeeObject {
    _type: 'tee';
    location: LocationObject;
}

export interface StypeObject {
    _type: 'type';
    ftype: false;
    name: string;
    location: LocationObject;
}

export interface FtypeObject {
    _type: 'type';
    ftype: true;
    from: TypeObject[];
    to: TypeObject;
    location: LocationObject;
}

export type TypeObject = StypeObject | FtypeObject;

export interface VarObject {
    _type: 'var';
    type: 'ruleset' | 'normal';
    rulesetName?: string;
    name: string;
    location: LocationObject;
}

export interface LocationObject {
    start: LocationObjectInternal;
    end: LocationObjectInternal;
}

interface LocationObjectInternal {
    offset: number;
    line: number;
    column: number;
}