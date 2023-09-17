import { PLocation } from "../../2-file-to-parse-tree/ParseTreeDefinitions";
import InterpolativeString from "./InterpolativeString";
import StackTrace from "./StackTrace";

/**
 * Type/plain variable/dollar variable scope.
 */
export default class Scope {

	private readonly typeMap = new Map<string, number>();
	private readonly varMap = new Map<string, number>();
	private readonly dollarVarMap = new Map<string, number>();

	private readonly parent: Scope | null;

	private readonly trace: StackTrace;

	constructor (parent: Scope | null, trace: StackTrace) {
		this.parent = parent;
		this.trace = trace;
	}
	
	public extend(type: string, name: string | null, location: PLocation): Scope {
		var child = new Scope(this, this.trace.extend({type, name, location}));
		return child;
	}

	public error(message: string | InterpolativeString): Error {
		return this.trace.error(message);
	}

	public hasOwnType(name: string): boolean {
		return this.typeMap.has(name);
	}

	public hasType(name: string): boolean {
		return this.hasOwnType(name)
			|| (!!this.parent && this.parent.hasType(name));
	}

	public addType(name: string, _id: number): void {
		if (this.hasOwnType(name)) {
			throw this.error(`Type ${name} has already been declared in this scope`);
		}

		this.typeMap.set(name, _id);
	}

	public getType(name: string): number {
		if (this.hasOwnType(name)) {
			return this.typeMap.get(name)!;
		}

		if (this.parent) {
			return this.parent.getType(name);
		}

		throw this.error(`Type ${name} is not defined`);
	}

	public hasOwnVar(name: string): boolean {
		return this.varMap.has(name);
	}

	public hasVar(name: string): boolean {
		return this.hasOwnVar(name)
			|| (!!this.parent && this.parent.hasVar(name));
	}

	public addVar(name: string, _id: number): void {
		if (this.hasOwnVar(name)) {
			throw this.error(`Variable ${name} has already been declared in this scope`);
		}

		this.varMap.set(name, _id);
	}

	public getVar(name: string): number {
		if (this.hasOwnVar(name)) {
			return this.varMap.get(name)!;
		}

		if (this.parent) {
			return this.parent.getVar(name);
		}

		throw this.error(`Variable ${name} is not defined`);
	}

	public hasOwnDollarVar(name: string): boolean {
		return this.dollarVarMap.has(name);
	}

	public hasDollarVar(name: string): boolean {
		return this.hasOwnDollarVar(name)
			|| (!!this.parent && this.parent.hasDollarVar(name));
	}

	public addDollarVar(name: string, _id: number): void {
		if (this.hasOwnDollarVar(name)) {
			throw this.error(`Named subproof ${name} has already been declared in this scope`);
		}

		this.dollarVarMap.set(name, _id);
	}

	public getDollarVar(name: string): number {
		if (this.hasOwnDollarVar(name)) {
			return this.dollarVarMap.get(name)!;
		}

		if (this.parent) {
			return this.parent.getDollarVar(name);
		}

		throw this.error(`Named subproof ${name} is not defined`);
	}
}