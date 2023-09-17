/*
 * Uses Hungarian notation ('S') because who cares
 * about good naming convention
 */

import { PDefpackage, PImport, PLocation } from "../2-file-to-parse-tree/ParseTreeDefinitions";

export type SymbolTable = Symbol[];

export type Symbol = SFile | SDefsystem | SDeftype | SDefvar | SDefparam | SDefschemaparam | SDefun | SDefschema | SDefnamedsubproof;

export type SFile = {
	_type: 'file';
	_id: number;
	defpackage: PDefpackage | null;
	imports: PImport[];
	defsystems: SReference[];
};

export type SDefsystem = {
	_type: 'defsystem';
	_id: number;
	name: string;
	extends_: string[];
	lines: SReference[];
	location: PLocation;
};

export type SDeftype = {
	_type: 'deftype';
	_id: number;
	doc: string | null;
	name: string;
	expr: SType | null;
	location: PLocation;
}

export type SDefvar = {
	_type: 'defvar';
	_id: number;
	doc: string | null;
	tex: string | null;
	sealed: boolean;
	type: SType;
	name: string;
	expr: SObjectexpr | null;
	location: PLocation;
}

export type SDefparam = {
	_type: 'defparam';
	_id: number;
	tex: string | null;
	type: SType;
	name: string;
	location: PLocation;
}

export type SDefschemaparam = {
	_type: 'defschemaparam';
	_id: number;
	tex: string | null;
	type: SType;
	name: string;
	selector: string | null;
	location: PLocation;
}

export type SDefun = {
	_type: 'defun';
	_id: number;
	doc: string | null;
	tex_attributes: {
		precedence: number
	} | null;
	tex: string | null;
	sealed: boolean;
	rettype: SType;
	name: string;
	params: SReference[];
	expr: SObjectexpr | null;
	location: PLocation;
}

export type SDefschema = {
	_type: 'defschema';
	_id: number;
	doc: string | null;
	schemaType: 'axiom' | 'schema' | 'theorem';
	name: string;
	params: SReference[];
	using: (SReference | SUnresolvedReference)[];
	defnamedsubproofs: SReference[];
	expr: SMetaexpr;
	location: PLocation;
}

export type SFeed = {
	_type: 'feed';
	left: SMetaexpr[];
	subject: SMetaexpr;
	args: Array<SObjectexpr | null> | null;
	as_: SMetaexpr | null;
	location: PLocation;
}

export type SSchemacall = {
	_type: 'schemacall';
	schema: SMetaexpr;
	args: SObjectexpr[];
	location: PLocation;
}

export type SFuncall = {
	_type: 'funcall';
	fun: SObjectexpr;
	args: SObjectexpr[];
	location: PLocation;
}

export type SSchemaexpr = {
	_type: 'schemaexpr';
	params: SReference[];
	body: {
		defnamedsubproofs: SReference[];
		expr: SMetaexpr;
	}
	location: PLocation;
}

export type SFunexpr = {
	_type: 'funexpr';
	params: SReference[];
	body: SObjectexpr;
	location: PLocation;
}

export type SConditional = {
	_type: 'conditional';
	left: SMetaexpr[];
	right: {
		defnamedsubproofs: SReference[];
		expr: SMetaexpr;
	}
	location: PLocation;
}

export type SWith = {
	_type: 'with';
	doc: string | null;
	tex: string | null;
	type: SType;
	varname: string;
	varexpr: SObjectexpr;
	defnamedsubproofs: SReference[];
	expr: SMetaexpr;
	location: PLocation;
}

export type SMetaexpr = SFeed | SConditional | SSchemacall | SVar | SSchemaexpr | SWith;

export type SObjectexpr = SFuncall | SFunexpr | SVar;

export type SDefnamedsubproof = {
	_type: 'defnamedsubproof';
	_id: number;
	name: string;
	expr: SMetaexpr;
	location: PLocation;
}

export type SType = SUnresolvedReference | SReference | SFtype;

export type SFtype = {
	_type: 'ftype';
	from: SType[];
	to: SType;
	location: PLocation;
}

export type SVar = SUnresolvedReference | SReference | SHypothesis;

export type SReference = {
	_type: 'reference';
	id: number;
}

export type SUnresolvedReference = {
	_type: 'unresolvedreference';
	name: string;
}

export type SHypothesis = {
	_type: 'hypothesis';
	index: number;
	location: PLocation;
}