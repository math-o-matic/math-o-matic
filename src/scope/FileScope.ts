import $Variable from "../expr/$Variable";
import Variable from "../expr/Variable";
import StackTrace from "../StackTrace";
import { SimpleType } from "../type/SimpleType";
import Scope from "./Scope";

/**
 * This is in fact the root scope.
 */
export default class FileScope extends Scope {

	public readonly importMap = new Map<string, FileScope>();

	/**
	 * 파일 경로. 예를 들어 `/propositional.math`이다. 파일과 일대일대응이어야 한다.
	 */
	public readonly fileUri: string | null;

	constructor (fileUri: string | null) {
		super(null, new StackTrace(fileUri));

		this.fileUri = fileUri;
	}

	public override hasOwnSimpleType(name: string): boolean {
		return super.hasOwnSimpleType(name)
			|| [...this.importMap.values()].some(s => s.hasOwnSimpleType(name));
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

		for (var scope of this.importMap.values()) {
			if (scope.hasType(name)) {
				return scope.getSimpleType(name);
			}
		}

		throw this.error('wut');
	}

	public override hasOwnVariable(name: string): boolean {
		return super.hasOwnVariable(name)
			|| [...this.importMap.values()].some(s => s.hasOwnVariable(name));
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

		for (var scope of this.importMap.values()) {
			if (scope.hasVariable(name)) {
				return scope.getVariable(name);
			}
		}

		throw this.error('wut');
	}

	public override hasOwn$(name: string): boolean {
		return super.hasOwn$(name)
			|| [...this.importMap.values()].some(s => s.hasOwn$(name));
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

		for (var scope of this.importMap.values()) {
			if (scope.has$(name)) {
				return scope.get$(name);
			}
		}

		throw this.error('wut');
	}
}