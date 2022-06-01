import { SchemaType } from "./decoration/SchemaDecoration";

export type StartObject = {
	_type: 'start';
	defpackage: DefpackageObject | null;
	imports: ImportObject[];
	systems: DefsystemObject[];
};

export type LineObject = TypedefObject
		| DefvObject
		| DefunObject
		| DefschemaObject;

export type EvaluableObject = TypedefObject
		| DefvObject
		| DefunObject
		| DefschemaObject
		| ExprObject;

export interface DefpackageObject {
	_type: 'defpackage';
	name: string;
	location: LocationObject;
}

export interface ImportObject {
	_type: 'import';
	name: string;
	location: LocationObject;
}

export interface DefsystemObject {
	_type: 'defsystem';
	name: string;
	extends_: string[];
	lines: LineObject[];
	location: LocationObject;
}

export interface TypedefObject {
	_type: 'typedef';
	doc: string;
	expr: FtypeObject;
	name: string;
	location: LocationObject;
}

export interface DefvObject {
	_type: 'defv';
	isParam: boolean;
	selector?: string;
	doc: string | null;
	tex: string | null;
	sealed?: boolean;
	type: TypeObject;
	name: string;
	expr?: ObjectExprObject;
	location: LocationObject;
}

export interface DefunObject {
	_type: 'defun';
	doc: string | null;
	tex: string | null;
	tex_attributes: {
		precedence: number
	};
	sealed: boolean;
	rettype: TypeObject;
	name: string;
	params: DefvObject[];
	expr: ObjectExprObject;
	location: LocationObject;
}

export type ObjectExprObject = FuncallObject | FunexprObject | VarObject;
export type ExprObject = ConditionalObject | ReductionObject | SchemacallObject | WithObject | VarObject | SchemaexprObject;

export interface DefschemaObject {
	_type: 'defschema';
	doc: string;
	schemaType: SchemaType,
	name: string;
	params: DefvObject[];
	using: string[];
	def$s: Def$Object[];
	expr: ExprObject;
	location: LocationObject;
}

export interface ReductionObject {
	_type: 'reduction';
	subject: ExprObject;
	args: Array<ObjectExprObject | null>;
	antecedents: ExprObject[];
	as: ExprObject;
	location: LocationObject;
}

export interface SchemacallObject {
	_type: 'schemacall';
	schema: ExprObject;
	args: ObjectExprObject[];
	location: LocationObject;
}

export interface FuncallObject {
	_type: 'funcall';
	schema: ObjectExprObject;
	args: ObjectExprObject[];
	location: LocationObject;
}

export interface FunexprObject {
	_type: 'funexpr';
	params: DefvObject[];
	expr: ObjectExprObject;
	location: LocationObject;
}

export interface SchemaexprObject {
	_type: 'schemaexpr';
	params: DefvObject[];
	def$s: Def$Object[];
	expr: ExprObject;
	location: LocationObject;
}

export interface WithObject {
	_type: 'with';
	with: DefvObject;
	def$s: Def$Object[];
	expr: ExprObject;
	location: LocationObject;
}

export interface ConditionalObject {
	_type: 'conditional';
	left: ExprObject[];
	def$s: Def$Object[];
	right: ExprObject;
	location: LocationObject;
}

export interface Def$Object {
	_type: 'def$';
	name: string;
	expr: ExprObject;
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
	type: '@' | '$' | 'normal';
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