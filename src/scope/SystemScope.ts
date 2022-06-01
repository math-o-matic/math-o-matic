import $Variable from "../expr/$Variable";
import Variable from "../expr/Variable";
import StackTrace from "../StackTrace";
import { SimpleType } from "../type/SimpleType";
import FileScope from "./FileScope";
import Scope from "./Scope";

export default class SystemScope extends Scope {

	public readonly extendsMap = new Map<string, SystemScope>();

	public readonly name: string;

	public override readonly parent: FileScope;

	constructor (parent: FileScope, name: string, trace: StackTrace) {
		super(parent, trace);

		this.name = name;
		this.parent = parent;
	}

	public override hasOwnSimpleType(name: string): boolean {
		return super.hasOwnSimpleType(name)
			|| [...this.extendsMap.values()].some(s => s.hasOwnSimpleType(name));
	}

	public override getSimpleType(name: string): SimpleType {
		if (!this.hasType(name)) {
			throw this.error(`Type ${name} is not defined`);
		}
		
		if (this.typeMap.has(name)) {
			return this.typeMap.get(name)!;
		}

		if (this.parent?.hasType(name)) {
			return this.parent.getSimpleType(name);
		}

		for (var scope of this.extendsMap.values()) {
			if (scope.hasType(name)) {
				return scope.getSimpleType(name);
			}
		}

		throw this.error('wut');
	}

	public override hasOwnVariable(name: string): boolean {
		return super.hasOwnVariable(name)
			|| [...this.extendsMap.values()].some(s => s.hasOwnVariable(name));
	}

	public override getVariable(name: string): Variable {
		if (!this.hasVariable(name))
			throw this.error(`Definition ${name} is not defined`);

		if (this.variableMap.has(name)) {
			return this.variableMap.get(name)!;
		}

		if (this.parent?.hasVariable(name)) {
			return this.parent.getVariable(name);
		}

		for (var scope of this.extendsMap.values()) {
			if (scope.hasVariable(name)) {
				return scope.getVariable(name);
			}
		}

		throw this.error('wut');
	}

	public override hasOwn$(name: string): boolean {
		return super.hasOwn$(name)
			|| [...this.extendsMap.values()].some(s => s.hasOwn$(name));
	}

	public override get$(name: string): $Variable {
		if (!this.has$(name))
			throw this.error(`$ variable ${name} is not defined`);
		
		if (this.$Map.has(name)) {
			return this.$Map.get(name)!;
		}

		if (this.parent?.has$(name)) {
			return this.parent.get$(name);
		}

		for (var scope of this.extendsMap.values()) {
			if (scope.has$(name)) {
				return scope.get$(name);
			}
		}

		throw this.error('wut');
	}
}