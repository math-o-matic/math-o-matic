import $Variable from './expr/$Variable';
import Expr from './expr/Expr';
import Variable from './expr/Variable';
import { LocationObject } from './PegInterfaceDefinitions';
import StackTrace from './StackTrace';
import SchemaDecoration from './decoration/SchemaDecoration';
import { FunctionalType } from './type/FunctionalType';
import { SimpleType } from './type/SimpleType';
import Type from './type/Type';

/*
 * 'st'                     -> st
 * ['cls', 'st']            -> [cls -> st]
 * ['cls', 'cls', 'st']     -> [(cls, cls) -> st]
 * [['cls', 'st'], 'st']    -> [[cls -> st] -> st]
 */
export type NestedTypeInput = string | NestedTypeInput[];

/**
 * 변수 영역(scope).
 * 구문 분석 과정에서 name resolution을 할 때에만 사용해야 한다.
 */
export default class Scope {
	public readonly importMap: Map<string, Scope> = new Map();

	public readonly typeMap: Map<string, SimpleType> = new Map();
	public readonly variableMap: Map<string, Variable> = new Map();
	public readonly $Map: Map<string, $Variable> = new Map();
	public readonly hypotheses: Expr[] = [];

	public readonly parent: Scope;
	public readonly root: Scope;

	public readonly trace: StackTrace;

	/**
	 * 파일 경로. 예를 들어 `/propositional.math`이다. 파일과 일대일대응이어야 한다.
	 */
	public readonly fileUri: string;

	constructor (fileUri: string, parent: Scope, trace?: StackTrace) {
		this.fileUri = fileUri;
		this.parent = parent;
		this.root = parent ? parent.root : this;

		if (trace && !(trace instanceof StackTrace)) {
			throw Error('Assertion failed');
		}

		this.trace = trace || new StackTrace(fileUri);
	}

	public extend(type: string, name: string, location: LocationObject): Scope {
		var child = new Scope(this.fileUri, this, this.trace.extend({type, name, location}));
		this.hypotheses.forEach(h => child.hypotheses.push(h));
		return child;
	}

	public error(message: string): Error {
		return this.trace.error(message);
	}

	public hasOwnType(name: NestedTypeInput): boolean {
		if (typeof name == 'string') {
			return this.typeMap.has(name)
				|| [...this.importMap.values()].some(s => s.hasOwnType(name));
		}

		if (!(name instanceof Array))
			throw this.error('Argument is malformed');

		if (name.length < 2)
			throw this.error('Illegal array length');

		return name.map(e => {
			return this.hasOwnType(e);
		}).every(e => e);
	}

	public hasType(name: NestedTypeInput): boolean {
		if (typeof name == 'string') {
			return this.hasOwnType(name)
				|| (!!this.parent && this.parent.hasType(name));
		}

		if (!(name instanceof Array))
			throw this.error('Argument is malformed');

		if (name.length < 2)
			throw this.error('Illegal array length');

		return name.map(e => {
			return this.hasType(e);
		}).every(e => e);
	}

	public addType(type: SimpleType): SimpleType {
		if (!(type instanceof SimpleType))
			throw this.error('Illegal argument type');

		if (!type.name)
			throw this.error('Something\'s wrong');

		if (this.hasOwnType(type.name))
			throw this.error(`Type ${type.name} has already been declared`);

		this.typeMap.set(type.name, type);
		return type;
	}

	/*
	 * Possible input values:
	 * 'st'						-> st
	 * ['cls', 'st']			-> [cls -> st]
	 * ['cls', 'cls', 'st']		-> [(cls, cls) -> st]
	 * [['cls', 'st'], 'st']	-> [[cls -> st] -> st]
	 */
	public getType(name: NestedTypeInput): Type {
		if (typeof name == 'string') {
			if (!this.hasType(name))
				throw this.error(`Type ${name} is not defined`);

			return this.typeMap.has(name)
				? this.typeMap.get(name)
				: (!!this.parent && this.parent.getType(name))
					|| [...this.importMap.values()].filter(s => {
						return s.hasType(name)
					})[0].getType(name);
		}

		if (!(name instanceof Array))
			throw this.error('Argument is malformed');

		if (name.length < 2)
			throw this.error('Illegal array length');

		var from = name.slice(0, name.length - 1).map(e => {
			return this.getType(e);
		});

		var to = this.getType(name[name.length - 1]);

		return new FunctionalType({
			from,
			to
		}, this.trace);
	}

	public hasOwnVariable(name: string): boolean {
		return this.variableMap.has(name)
			|| [...this.importMap.values()].some(s => s.hasOwnVariable(name));
	}

	public hasVariable(name: string): boolean {
		return this.hasOwnVariable(name)
			|| (!!this.parent && this.parent.hasVariable(name));
	}

	public addVariable(variable: Variable): Variable {
		if (!(variable instanceof Variable))
			throw this.error('Illegal argument type');

		if (this.hasOwnVariable(variable.name))
			throw this.error(`Definition ${variable.name} has already been declared`);

		this.variableMap.set(variable.name, variable);
		return variable;
	}

	public getVariable(name: string): Variable {
		if (!this.hasVariable(name))
			throw this.error(`Definition ${name} is not defined`);

		return this.variableMap.has(name)
			? this.variableMap.get(name)
			: (!!this.parent && this.parent.getVariable(name))
				|| [...this.importMap.values()].filter(s => {
					return s.hasVariable(name)
				})[0].getVariable(name);
	}

	public hasOwn$(name: string): boolean {
		return this.$Map.has(name)
			|| [...this.importMap.values()].some(s => s.hasOwn$(name));
	}

	public has$(name: string): boolean {
		return this.hasOwn$(name)
			|| (!!this.parent && this.parent.has$(name));
	}

	public add$($: $Variable): $Variable {
		if (!($ instanceof $Variable))
			throw this.error('Illegal argument type');

		if (this.hasOwn$($.name))
			throw this.error(`$ variable ${$.name} has already been declared`);

		this.$Map.set($.name, $);
		return $;
	}

	public get$(name: string): $Variable {
		if (!this.has$(name))
			throw this.error(`$ variable ${name} is not defined`);

		return this.$Map.has(name)
			? this.$Map.get(name)
			: (!!this.parent && this.parent.get$(name))
				|| [...this.importMap.values()].filter(s => {
					return s.has$(name)
				})[0].get$(name);
	}
}