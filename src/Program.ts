let parser: ParserType, evalParser: EvalParserType;

if (process.env.__webpack__) {
	parser = require('../dist/parser');
	evalParser = require('../dist/evalParser');
} else {
	let fs = require('fs');
	let path = require('path');
	let pegjs = require('pegjs');

	let grammar = fs.readFileSync(path.join(__dirname, 'grammar.pegjs'), 'utf-8');
	parser = pegjs.generate(grammar, {cache: true});
	evalParser = pegjs.generate(grammar, {cache: true, allowedStartRules: ['evaluable']});
}

interface LoaderReturnType {
	fileUri?: string;
	code: string;
}

type LoaderType = (fqn: string) => (LoaderReturnType | Promise<LoaderReturnType>);

export type ParserType = {
	parse: (code: string) => StartObject;
};

export type EvalParserType = {
	parse: (code: string) => EvaluableObject;
}

export default class Program {
	
	public scope: SystemScope | null = null;
	
	public static parser: ParserType = parser;
	public static evalParser: EvalParserType = evalParser;

	/**
	 * A temporary list used by {@link loadSystemInternal} method.
	 * 
	 * This is the list of FQNs of the systems with a temporary mark during a
	 * depth-first topological sort. Note that the system is considered to be
	 * marked with a permanent mark if {@link fileScopeMap} has the FQN.
	 * 
	 * See https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search.
	 */
	private loadingSystems: string[] | null = null;

	/**
	 * A map that maps the FQN of the system to the {@link FileScope} that
	 * contains the system.
	 * 
	 * See {@link loadingSystems}.
	 */
	private readonly fileScopeMap = new Map<string, FileScope>();

	public async loadSystem(fqn: string, loader: LoaderType): Promise<SystemScope> {
		this.loadingSystems = [];

		var fileScope = await this.loadSystemInternal(fqn, loader);

		var systemName = fqn.slice(fqn.lastIndexOf('.') + 1);

		if (!fileScope.hasSystem(systemName)) {
			throw Error(`System ${fqn} not found`);
		}

		return this.scope = fileScope.getSystem(systemName);
	}

	private async loadSystemInternal(fqn: string, loader: LoaderType): Promise<FileScope> {
		// the system has a permanent mark
		if (this.fileScopeMap.has(fqn)) {
			return this.fileScopeMap.get(fqn)!;
		}

		if (!this.loadingSystems) {
			throw Error('wut');
		}

		var loadingSystemIndex = this.loadingSystems.indexOf(fqn);

		// the system has a temporary mark
		if (loadingSystemIndex >= 0) {
			if (loadingSystemIndex == this.loadingSystems.length - 1) {
				throw Error(`Cannot self import (${fqn})`);
			}

			var cycle = this.loadingSystems.slice(loadingSystemIndex).concat(fqn);

			throw Error(`Circular import detected (${cycle.join(' -> ')}). Sadly, circular import is currently not supported.`);
		}

		// mark the system with a temporary mark
		this.loadingSystems.push(fqn);

		var {fileUri, code} = await loader(fqn);

		var scope = new FileScope(fileUri || null);

		var start = parser.parse(code);

		if (start.defpackage) {
			var packageName = fqn.slice(0, fqn.lastIndexOf('.'));
			
			if (start.defpackage.name != packageName) {
				throw scope.extend('defpackage', null, start.defpackage.location).error(`Package declaration ${start.defpackage.name} does not match the expected package name ${packageName}`);
			}
		}

		for (let line of start.imports) {
			var imported = await this.loadSystemInternal(line.name, loader);
			for (var importedSys of imported.systemMap.values()) {
				scope.importMap.set(importedSys.name, importedSys);
			}
		}

		for (let line of start.systems) {
			var sysScope = PegInterface.defsystem(line, scope);

			if (scope.hasSystem(sysScope.name)) {
				throw scope.error(`System ${sysScope.name} has already been declared`);
			}

			scope.addSystem(sysScope);
		}

		// remove the temporary mark
		if (this.loadingSystems.pop() != fqn) {
			throw Error('Something\'s wrong');
		}

		// mark the system with a permanent mark
		this.fileScopeMap.set(fqn, scope);
		return scope;
	}

	public evaluate(code: string) {
		if (!this.scope) throw Error('wut');
		
		var line = evalParser.parse(code);

		var scope = new Scope(this.scope, new StackTrace('<repl>'));

		switch (line._type) {
			case 'typedef':
				return PegInterface.type(line, scope);
			case 'defv':
				return PegInterface.variable(line, scope);
			case 'defun':
				return PegInterface.fun(line, scope);
			case 'defschema':
			case 'schemaexpr':
				return PegInterface.schema(line, scope, null);
			case 'conditional':
				return PegInterface.conditional(line, scope, null);
			case 'reduction':
				return PegInterface.reduction(line, scope, null);
			case 'schemacall':
				return PegInterface.schemacall(line, scope, null);
			case 'var':
				return PegInterface.metavar(line, scope);
			default:
				throw Error(`Unknown line type ${(line as any)._type}`);
		}
	}

	public getProofExplorer(name: string, ktx: (s: string) => string, yamd: {render: (s: string) => string}) {
		if (!this.scope) throw Error('wut');

		return ProofExplorer.get(this.scope, name, ktx, yamd);
	}
}

import PegInterface from './PegInterface';
import { EvaluableObject, StartObject } from './PegInterfaceDefinitions';
import ProofExplorer from './ProofExplorer';
import FileScope from './scope/FileScope';
import Scope from './scope/Scope';
import SystemScope from './scope/SystemScope';
import StackTrace from './StackTrace';
