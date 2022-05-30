import $Variable from '../expr/$Variable';
import Expr from '../expr/Expr';
import Variable from '../expr/Variable';
import { LocationObject } from '../PegInterfaceDefinitions';
import StackTrace from '../StackTrace';
import { FunctionalType } from '../type/FunctionalType';
import { SimpleType } from '../type/SimpleType';
import Type from '../type/Type';

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
	
	public readonly typeMap = new Map<string, SimpleType>();
	public readonly variableMap = new Map<string, Variable>();
	public readonly $Map = new Map<string, $Variable>();
	public readonly hypotheses: Expr[] = [];

	public readonly parent: Scope | null;

	public readonly trace: StackTrace;

	constructor (parent: Scope | null, trace: StackTrace) {
		this.parent = parent;

		if (!(trace instanceof StackTrace)) {
			throw Error('Assertion failed');
		}

		this.trace = trace;
	}

	public extend(type: string, name: string | null, location: LocationObject): Scope {
		var child = new Scope(this, this.trace.extend({type, name, location}));
		this.hypotheses.forEach(h => child.hypotheses.push(h));
		return child;
	}

	public error(message: string): Error {
		return this.trace.error(message);
	}

	public hasOwnSimpleType(name: string): boolean {
		return this.typeMap.has(name);
	}

	public hasOwnType(name: NestedTypeInput): boolean {
		if (typeof name == 'string') {
			return this.hasOwnSimpleType(name);
		}

		if (!(name instanceof Array))
			throw this.error('Argument is malformed');

		if (name.length < 2)
			throw this.error('Illegal array length');

		return name.every(e => {
			return this.hasOwnType(e);
		});
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

		return name.every(e => {
			return this.hasType(e);
		});
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

	public getSimpleType(name: string): SimpleType {
		if (!this.hasType(name)) {
			throw this.error(`Type ${name} is not defined`);
		}
		
		if (this.typeMap.has(name)) {
			return this.typeMap.get(name)!;
		}

		if (this.parent?.hasType(name)) {
			return this.parent.getSimpleType(name);
		}

		throw this.error('wut');
	}

	public getType(name: NestedTypeInput): Type {
		if (typeof name == 'string') {
			return this.getSimpleType(name);
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
		return this.variableMap.has(name);
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

		if (this.variableMap.has(name)) {
			return this.variableMap.get(name)!;
		}

		if (this.parent?.hasVariable(name)) {
			return this.parent.getVariable(name);
		}

		throw this.error('wut');
	}

	public hasOwn$(name: string): boolean {
		return this.$Map.has(name);
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
		
		if (this.$Map.has(name)) {
			return this.$Map.get(name)!;
		}

		if (this.parent?.has$(name)) {
			return this.parent.get$(name);
		}

		throw this.error('wut');
	}
}