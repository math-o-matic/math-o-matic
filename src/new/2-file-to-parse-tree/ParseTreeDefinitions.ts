/*
 * Uses Hungarian notation ('P') because who cares
 * about good naming convention
 */

export type PFile = {
	_type: 'file';
	defpackage: PDefpackage | null;
	imports: PImport[];
	defsystems: PDefsystem[];
};

export type PDefpackage = {
	_type: 'defpackage';
	name: string;
	location: PLocation;
}

export type PImport = {
	_type: 'import';
	name: string;
	location: PLocation;
}

export type PDefsystem = {
	_type: 'defsystem';
	name: string;
	extends_: string[];
	lines: PLine[];
	location: PLocation;
}

export type PLine = PDeftype
		| PDefvar
		| PDefun
		| PDefschema;

export type PEvaluable = PDeftype
		| PDefvar
		| PDefun
		| PDefschema
		| PMetaexpr;

export type PDeftype = {
	_type: 'deftype';
	doc: string | null;
	name: string;
	expr: PType | null;
	location: PLocation;
}

export type PDefvar = {
	_type: 'defvar';
	doc: string | null;
	tex: string | null;
	sealed: boolean;
	type: PType;
	name: string;
	expr: PObjectexpr | null;
	location: PLocation;
}

export type PDefparam = {
	_type: 'defparam';
	tex: string | null;
	type: PType;
	name: string;
	location: PLocation;
}

export type PDefschemaparam = {
	_type: 'defschemaparam';
	tex: string | null;
	type: PType;
	name: string;
	selector: string | null;
	location: PLocation;
}

export type PDefun = {
	_type: 'defun';
	doc: string | null;
	tex_attributes: {
		precedence: number
	} | null;
	tex: string | null;
	sealed: boolean;
	rettype: PType;
	name: string;
	params: PDefparam[];
	expr: PObjectexpr | null;
	location: PLocation;
}

export type PDefschema = {
	_type: 'defschema';
	doc: string | null;
	schemaType: 'axiom' | 'schema' | 'theorem';
	name: string;
	params: PDefschemaparam[];
	using: string[];
	defnamedsubproofs: PDefnamedsubproof[];
	expr: PMetaexpr;
	location: PLocation;
}

export type PFeed = {
	_type: 'feed';
	left: PMetaexpr[];
	subject: PMetaexpr;
	args: Array<PObjectexpr | null> | null;
	as_: PMetaexpr | null;
	location: PLocation;
}

export type PSchemacall = {
	_type: 'schemacall';
	schema: PMetaexpr;
	args: PObjectexpr[];
	location: PLocation;
}

export type PFuncall = {
	_type: 'funcall';
	fun: PObjectexpr;
	args: PObjectexpr[];
	location: PLocation;
}

export type PSchemaexpr = {
	_type: 'schemaexpr';
	params: PDefparam[];
	body: {
		defnamedsubproofs: PDefnamedsubproof[];
		expr: PMetaexpr;
	}
	location: PLocation;
}

export type PFunexpr = {
	_type: 'funexpr';
	params: PDefparam[];
	body: PObjectexpr;
	location: PLocation;
}

export type PConditional = {
	_type: 'conditional';
	left: PMetaexpr[];
	right: {
		defnamedsubproofs: PDefnamedsubproof[];
		expr: PMetaexpr;
	}
	location: PLocation;
}

export type PWith = {
	_type: 'with';
	doc: string | null;
	tex: string | null;
	type: PType;
	varname: string;
	varexpr: PObjectexpr;
	defnamedsubproofs: PDefnamedsubproof[];
	expr: PMetaexpr;
	location: PLocation;
}

export type PMetaexpr = PFeed | PConditional | PSchemacall | PVar | PSchemaexpr | PWith;

export type PObjectexpr = PFuncall | PFunexpr | PVar;

export type PDefnamedsubproof = {
	_type: 'defnamedsubproof';
	name: string;
	expr: PMetaexpr;
	location: PLocation;
}

export type PType = PStype | PFtype;

export type PStype = {
	_type: 'stype';
	name: string;
	location: PLocation;
}

export type PFtype = {
	_type: 'ftype';
	from: PType[];
	to: PType;
	location: PLocation;
}

export type PVar = PAtVar | PDollarVar | PPlainVar;

export type PAtVar = {
	_type: '@var';
	name: string;
	location: PLocation;
}

export type PDollarVar = {
	_type: '$var';
	name: string;
	location: PLocation;
}

export type PPlainVar = {
	_type: 'var';
	name: string;
	location: PLocation;
}

export type PLocation = {
	start: {
		offset: number;
		line: number;
		column: number;
	};
	end: {
		offset: number;
		line: number;
		column: number;
	};
}