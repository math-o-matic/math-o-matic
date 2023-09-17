import type { PDefsystem, PDefvar, PFile, PDeftype, PDefun, PDefschema, PType, PStype, PFtype, PObjectexpr, PFuncall, PFunexpr, PDefparam, PAtVar, PDollarVar, PPlainVar, PDefschemaparam, PDefnamedsubproof, PMetaexpr, PFeed, PConditional, PSchemacall, PSchemaexpr, PWith } from "../2-file-to-parse-tree/ParseTreeDefinitions";
import type { SConditional, SDefnamedsubproof, SDefparam, SDefschema, SDefschemaparam, SDeftype, SDefun, SDefvar, SFeed, SFtype, SFuncall, SFunexpr, SHypothesis, SMetaexpr, SObjectexpr, SReference, SSchemacall, SSchemaexpr, SType, SUnresolvedReference, SWith, SymbolTable } from "./SymbolTableDefinitions";
import Counter from "../../util/Counter";
import Scope from "./util/Scope";
import StackTrace from "./util/StackTrace";

/**
 * Name resolves a parse tree and returns a symbol table.
 * 
 * Note that:
 *  - input validation e.g. type checking is not performed
 *  - unresolved identifiers are regarded as external and should be resolved by the linker
 *  - hypothesis selectors e.g. `@h1` are left as is
 * 
 * Return types:
 *  - NonSymbol: nothing to add to the table, result is a non symbol
 *  - Table: add Table to the table, result is the last element of the Table and is a symbol
 *  - [Table, NonSymbol]: add Table to the table, result is a non symbol (not included in Table)
 */
export default class NameResolver {

	private obj: PFile;

	// _id value is unique within a file
	private counter = new Counter();

	constructor(obj: PFile) {
		this.obj = obj;
	}

	public getReferenceTo(table: SymbolTable): SReference {
		if (table.length == 0) {
			throw Error('wut');
		}

		return {
			_type: 'reference',
			id: table.at(-1)!._id
		};
	}
	
	public resolve(stackTrace: StackTrace): SymbolTable {

		var {defpackage, imports, defsystems} = this.obj;
		var scope = new Scope(null, stackTrace);

		var defsystemTables: SymbolTable[] = defsystems.map(defsystem => {
			return this.defsystem(defsystem, scope);
		});

		return [
			...defsystemTables.flat(),
			{
				_type: 'file',
				_id: this.counter.next(),
				defpackage,
				imports,
				defsystems: defsystemTables.map(table => this.getReferenceTo(table))
			}
		];
	}

	public defsystem(obj: PDefsystem, parentScope: Scope): SymbolTable {

		var {name, extends_, lines, location} = obj;
		var scope = parentScope.extend('system', name, location);

		var lineTables: SymbolTable[] = lines.map(line => {
			switch (line._type) {
				case 'deftype': {
					let symbol = this.deftype(line, scope);
					scope.addType(symbol.name, symbol._id);
					return [symbol];
				}
				case 'defvar': {
					let table = this.defvar(line, scope);
					let symbol = table.at(-1) as SDefvar;
					scope.addVar(symbol.name, symbol._id);
					return table;
				}
				case 'defun': {
					let table = this.defun(line, scope);
					let symbol = table.at(-1) as SDefun;
					scope.addVar(symbol.name, symbol._id);
					return table;
				}
				case 'defschema': {
					let table = this.defschema(line, scope);
					let symbol = table.at(-1) as SDefschema;
					scope.addVar(symbol.name, symbol._id);
					return table;
				}
				default:
					throw Error('wut');
			}
		});

		var lineIds = lineTables.map(line => this.getReferenceTo(line));
		
		return [
			...lineTables.flat(),
			{
				_type: 'defsystem',
				_id: this.counter.next(),
				name,
				extends_,
				lines: lineIds,
				location
			}
		];
	}

	public deftype(obj: PDeftype, parentScope: Scope): SDeftype {

		var {doc, name, expr, location} = obj;
		var scope = parentScope.extend('type', name, location);

		var sType = expr && this.type(expr, scope);

		return {
			_type: 'deftype',
			_id: this.counter.next(),
			doc,
			name,
			expr: sType,
			location
		};
	}

	public type(obj: PType, parentScope: Scope): SType {

		var scope = parentScope;

		switch (obj._type) {
			case 'stype':
				return this.stype(obj, scope);
			case 'ftype':
				return this.ftype(obj, scope);
			default:
				throw Error('wut');
		}
	}

	public stype(obj: PStype, parentScope: Scope): SReference | SUnresolvedReference {

		var {name, location} = obj;
		var scope = parentScope;

		if (!scope.hasType(name)) {
			return {
				_type: 'unresolvedreference',
				name
			};
		}

		return {
			_type: 'reference',
			id: scope.getType(name)
		}
	}

	public ftype(obj: PFtype, parentScope: Scope): SFtype {

		var {from, to, location} = obj;
		var scope = parentScope;

		var fromNonSymbols = from.map(f => {
			return this.type(f, scope);
		});
		var toNonSymbol = this.type(to, scope);

		return {
			_type: 'ftype',
			from: fromNonSymbols,
			to: toNonSymbol,
			location
		};
	}

	public defvar(obj: PDefvar, parentScope: Scope): SymbolTable {

		var {doc, tex, sealed, type, name, expr, location} = obj;
		var scope = parentScope.extend('var', name, location);

		var typeNonSymbol = this.type(type, scope);

		var [exprTable, exprNonSymbol] = !expr ? [[], null] : this.objectexpr(expr, scope);

		return [
			...exprTable,
			{
				_type: 'defvar',
				_id: this.counter.next(),
				doc,
				tex,
				sealed,
				type: typeNonSymbol,
				name,
				expr: exprNonSymbol,
				location
			}
		];
	}

	public defparam(obj: PDefparam, parentScope: Scope): SDefparam {

		var {tex, type, name, location} = obj;
		var scope = parentScope.extend('param', name, location);

		var typeNonSymbol = this.type(type, scope);

		return {
			_type: 'defparam',
			_id: this.counter.next(),
			tex,
			type: typeNonSymbol,
			name,
			location
		};
	}

	public defschemaparam(obj: PDefschemaparam, parentScope: Scope): SDefschemaparam {
		
		var {tex, type, name, selector, location} = obj;
		var scope = parentScope.extend('schemaparam', name, location);

		var typeNonSymbol = this.type(type, scope);

		return {
			_type: 'defschemaparam',
			_id: this.counter.next(),
			tex,
			type: typeNonSymbol,
			name,
			selector,
			location
		}
	}

	public objectexpr(obj: PObjectexpr, parentScope: Scope): [SymbolTable, SObjectexpr] {

		var scope = parentScope;

		switch (obj._type) {
			case 'funcall':
				return this.funcall(obj, scope);
			case 'funexpr':
				return this.funexpr(obj, scope);
			case '@var':
				return [[], this.atVar(obj, scope)];
			case '$var':
				return [[], this.dollarVar(obj, scope)];
			case 'var':
				return [[], this.plainVar(obj, scope)];
			default:
				throw Error('wut');
		}
	}

	public funcall(obj: PFuncall, parentScope: Scope): [SymbolTable, SFuncall] {

		var {fun, args, location} = obj;
		var scope = parentScope;

		var [funTable, funNonSymbol] = this.objectexpr(fun, scope);
		var [argTables, argNonSymbols] = (() => {
			var tmp = args.map(arg => {
				return this.objectexpr(arg, scope);
			});

			return [
				tmp.map(e => e[0]),
				tmp.map(e => e[1])
			];
		})();

		return [
			[
				...funTable,
				...argTables.flat()
			],
			{
				_type: 'funcall',
				fun: funNonSymbol,
				args: argNonSymbols,
				location
			}
		];
	}

	public funexpr(obj: PFunexpr, parentScope: Scope): [SymbolTable, SFunexpr] {

		var {params, body, location} = obj;
		var scope = parentScope.extend('funexpr', null, location);

		var paramSymbols = params.map(param => {
			return this.defparam(param, scope);
		});

		for (var param of paramSymbols) {
			scope.addVar(param.name, param._id);
		}

		var [bodyTable, bodyNonSymbol] = this.objectexpr(body, scope);

		return [
			[
				...paramSymbols,
				...bodyTable
			],
			{
				_type: 'funexpr',
				params: paramSymbols.map(param => {
					return this.getReferenceTo([param]);
				}),
				body: bodyNonSymbol,
				location
			}
		];
	}

	public atVar(obj: PAtVar, parentScope: Scope): SHypothesis {

		var {name, location} = obj;
		var scope = parentScope;

		var match = name.match(/^@h([1-9][0-9]*)$/);

		if (!match) {
			throw scope.error(`Selector ${name} not recognized`);
		}

		return {
			_type: 'hypothesis',
			index: parseInt(match[1]),
			location
		};
	}

	public dollarVar(obj: PDollarVar, parentScope: Scope): SReference {

		var {name, location} = obj;
		var scope = parentScope;

		return {
			_type: 'reference',
			id: scope.getDollarVar(name)
		};
	}

	public plainVar(obj: PPlainVar, parentScope: Scope): SReference | SUnresolvedReference {

		var {name, location} = obj;
		var scope = parentScope;

		if (!scope.hasVar(name)) {
			return {
				_type: 'unresolvedreference',
				name
			};
		}

		return {
			_type: 'reference',
			id: scope.getVar(name)
		};
	}

	public defun(obj: PDefun, parentScope: Scope): SymbolTable {

		var {doc, tex_attributes, tex, sealed, rettype, name, params, expr, location} = obj;
		var scope = parentScope.extend('fun', name, location);

		var rettypeNonSymbol = this.type(rettype, scope);

		var paramSymbols = params.map(param => {
			return this.defparam(param, scope);
		});

		for (let param of paramSymbols) {
			scope.addVar(param.name, param._id);
		}

		var [exprTable, exprNonSymbol] = !expr ? [[] as SymbolTable, null] : this.objectexpr(expr, scope);

		return [
			...paramSymbols,
			...exprTable,
			{
				_type: 'defun',
				_id: this.counter.next(),
				doc,
				tex_attributes,
				tex,
				sealed,
				rettype: rettypeNonSymbol,
				name,
				params: paramSymbols.map(param => {
					return this.getReferenceTo([param]);
				}),
				expr: exprNonSymbol,
				location
			}
		];
	}

	public defschema(obj: PDefschema, parentScope: Scope): SymbolTable {

		var {doc, schemaType, name, params, using, defnamedsubproofs, expr, location} = obj;
		var scope = parentScope.extend('schema', name, location);

		var paramSymbols = params.map(param => {
			var symbol = this.defschemaparam(param, scope);
			scope.addVar(symbol.name, symbol._id);
			return symbol;
		});

		var usingReferences: (SReference | SUnresolvedReference)[] = using.map(using => {
			if (!scope.hasVar(using)) {
				return {
					_type: 'unresolvedreference',
					name: using
				};
			}

			return {
				_type: 'reference',
				id: scope.getVar(using)
			};
		});

		var defnamedsubproofTables = defnamedsubproofs.map(defnamedsubproof => {
			var table = this.defnamedsubproof(defnamedsubproof, scope);
			var symbol = table.at(-1) as SDefnamedsubproof;
			scope.addDollarVar(symbol.name, symbol._id);
			return table;
		});

		var [exprTable, exprNonSymbol] = this.metaexpr(expr, scope);

		return [
			...paramSymbols,
			...defnamedsubproofTables.flat(),
			...exprTable,
			{
				_type: 'defschema',
				_id: this.counter.next(),
				doc,
				schemaType,
				name,
				params: paramSymbols.map(param => {
					return this.getReferenceTo([param]);
				}),
				using: usingReferences,
				defnamedsubproofs: defnamedsubproofTables.map(table => {
					return this.getReferenceTo(table);
				}),
				expr: exprNonSymbol,
				location
			}
		];
	}

	public defnamedsubproof(obj: PDefnamedsubproof, parentScope: Scope): SymbolTable {
		
		var {name, expr, location} = obj;
		var scope = parentScope.extend('named subproof', name, location);

		var [exprTable, exprNonSymbol] = this.metaexpr(expr, scope);

		return [
			...exprTable,
			{
				_type: 'defnamedsubproof',
				_id: this.counter.next(),
				name,
				expr: exprNonSymbol,
				location
			}
		];
	}

	public metaexpr(obj: PMetaexpr, parentScope: Scope): [SymbolTable, SMetaexpr] {
		var scope = parentScope;

		switch (obj._type) {
			case 'feed':
				return this.feed(obj, scope);
			case 'conditional':
				return this.conditional(obj, scope);
			case 'schemacall':
				return this.schemacall(obj, scope);
			case '@var':
				return [[], this.atVar(obj, scope)];
			case '$var':
				return [[], this.dollarVar(obj, scope)];
			case 'var':
				return [[], this.plainVar(obj, scope)];
			case 'schemaexpr':
				return this.schemaexpr(obj, scope);
			case 'with':
				return this.with(obj, scope);
			default:
				throw Error('wut');
		}
	}

	public feed(obj: PFeed, parentScope: Scope): [SymbolTable, SFeed] {
		
		var {left, subject, args, as_, location} = obj;
		var scope = parentScope.extend('feed', null, location);

		var [leftTables, leftNonSymbols] = (() => {
			var tmp = left.map(left => {
				return this.metaexpr(left, scope);
			});

			return [
				tmp.map(e => e[0]),
				tmp.map(e => e[1])
			];
		})();

		var [subjectTable, subjectNonSymbol] = this.metaexpr(subject, scope);

		var [argTables, argNonSymbols] = !args ? [[] as SymbolTable[], null] : (() => {
			var tmp: [SymbolTable, (SObjectexpr | null)][] = args.map(arg => {
				if (!arg) return [[] as SymbolTable, null];
				return this.objectexpr(arg, scope);
			});

			return [
				tmp.map(e => e[0]),
				tmp.map(e => e[1])
			];
		})();

		var [asTable, asNonSymbol] = !as_ ? [[] as SymbolTable, null] : this.metaexpr(as_, scope);

		return [
			[
				...leftTables.flat(),
				...subjectTable,
				...argTables.flat(),
				...asTable
			],
			{
				_type: 'feed',
				left: leftNonSymbols,
				subject: subjectNonSymbol,
				args: argNonSymbols,
				as_: asNonSymbol,
				location
			}
		];
	}

	public conditional(obj: PConditional, parentScope: Scope): [SymbolTable, SConditional] {

		var {left, right, location} = obj;
		var {defnamedsubproofs, expr} = right;
		var scope = parentScope.extend('conditional', null, location);

		var [leftTables, leftNonSymbols] = (() => {
			var tmp = left.map(left => {
				return this.metaexpr(left, scope);
			});

			return [
				tmp.map(e => e[0]),
				tmp.map(e => e[1])
			];
		})();

		var defnamedsubproofTables = defnamedsubproofs.map(defnamedsubproof => {
			var table = this.defnamedsubproof(defnamedsubproof, scope);
			var symbol = table.at(-1) as SDefnamedsubproof;
			scope.addDollarVar(symbol.name, symbol._id);
			return table;
		});

		var [exprTable, exprNonSymbol] = this.metaexpr(expr, scope);

		return [
			[
				...leftTables.flat(),
				...defnamedsubproofTables.flat(),
				...exprTable
			],
			{
				_type: 'conditional',
				left: leftNonSymbols,
				right: {
					defnamedsubproofs: defnamedsubproofTables.map(table => {
						return this.getReferenceTo(table);
					}),
					expr: exprNonSymbol
				},
				location
			}
		];
	}

	public schemacall(obj: PSchemacall, parentScope: Scope): [SymbolTable, SSchemacall] {

		var {schema, args, location} = obj;
		var scope = parentScope.extend('schemacall', null, location);

		var [schemaTable, schemaNonSymbol] = this.metaexpr(schema, scope);

		var [argTables, argNonSymbols] = (() => {
			var tmp = args.map(arg => {
				return this.objectexpr(arg, scope);
			});

			return [
				tmp.map(e => e[0]),
				tmp.map(e => e[1])
			];
		})();

		return [
			[
				...schemaTable,
				...argTables.flat()
			],
			{
				_type: 'schemacall',
				schema: schemaNonSymbol,
				args: argNonSymbols,
				location
			}
		];
	}

	public schemaexpr(obj: PSchemaexpr, parentScope: Scope): [SymbolTable, SSchemaexpr] {

		var {params, body, location} = obj;
		var {defnamedsubproofs, expr} = body;
		var scope = parentScope.extend('schemaexpr', null, location);

		var paramSymbols = params.map(param => {
			var symbol = this.defparam(param, scope);
			scope.addVar(symbol.name, symbol._id);
			return symbol;
		});

		var defnamedsubproofTables = defnamedsubproofs.map(defnamedsubproof => {
			var table = this.defnamedsubproof(defnamedsubproof, scope);
			var symbol = table.at(-1) as SDefnamedsubproof;
			scope.addDollarVar(symbol.name, symbol._id);
			return table;
		});

		var [exprTable, exprNonSymbol] = this.metaexpr(expr, scope);

		return [
			[
				...paramSymbols,
				...defnamedsubproofTables.flat(),
				...exprTable
			],
			{
				_type: 'schemaexpr',
				params: paramSymbols.map(param => {
					return this.getReferenceTo([param]);
				}),
				body: {
					defnamedsubproofs: defnamedsubproofTables.map(table => {
						return this.getReferenceTo(table);
					}),
					expr: exprNonSymbol
				},
				location
			}
		];
	}

	public with(obj: PWith, parentScope: Scope): [SymbolTable, SWith] {

		var {doc, tex, type, varname, varexpr, defnamedsubproofs, expr, location} = obj;
		var scope = parentScope.extend('with', null, location);

		var typeNonSymbol = this.type(type, scope);

		var [varexprTable, varexprNonSymbol] = this.objectexpr(varexpr, scope);

		var defnamedsubproofTables = defnamedsubproofs.map(defnamedsubproof => {
			var table = this.defnamedsubproof(defnamedsubproof, scope);
			var symbol = table.at(-1) as SDefnamedsubproof;
			scope.addDollarVar(symbol.name, symbol._id);
			return table;
		});

		var [exprTable, exprNonSymbol] = this.metaexpr(expr, scope);

		return [
			[
				...varexprTable,
				...defnamedsubproofTables.flat(),
				...exprTable
			],
			{
				_type: 'with',
				doc,
				tex,
				type: typeNonSymbol,
				varname,
				varexpr: varexprNonSymbol,
				defnamedsubproofs: defnamedsubproofTables.map(table => {
					return this.getReferenceTo(table);
				}),
				expr: exprNonSymbol,
				location
			}
		];
	}
}