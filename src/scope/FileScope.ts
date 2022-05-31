import $Variable from "../expr/$Variable";
import Variable from "../expr/Variable";
import StackTrace from "../StackTrace";
import { SimpleType } from "../type/SimpleType";
import Scope from "./Scope";
import SystemScope from "./SystemScope";

/**
 * This is in fact the root scope.
 */
export default class FileScope extends Scope {

	public readonly importMap = new Map<string, SystemScope>();
	public readonly systemMap = new Map<string, SystemScope>();

	/**
	 * 파일 경로. 예를 들어 `/propositional.math`이다. 파일과 일대일대응이어야 한다.
	 */
	public readonly fileUri: string | null;

	constructor (fileUri: string | null) {
		super(null, new StackTrace(fileUri));

		this.fileUri = fileUri;
	}
	
	public hasSystem(name: string): boolean {
		return this.systemMap.has(name)
				|| this.importMap.has(name);
	}

	public addSystem(system: SystemScope): SystemScope {
		if (!(system instanceof SystemScope)) {
			throw this.error('Illegal argument type');
		}

		if (this.hasSystem(system.name)) {
			throw this.error(`System ${system.name} has already been declared`);
		}

		this.systemMap.set(system.name, system);
		return system;
	}

	public getSystem(name: string): SystemScope {
		if (!this.hasSystem(name)) {
			throw this.error(`System ${name} is not defined`);
		}

		if (this.systemMap.has(name)) {
			return this.systemMap.get(name)!;
		}

		if (this.importMap.has(name)) {
			return this.importMap.get(name)!;
		}

		throw this.error('wut');
	}
}