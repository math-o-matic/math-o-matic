let parser: ParserType, evalParser: EvalParserType;

if (process.env.__webpack__) {
	parser = require('../build_tmp/parser');
	evalParser = require('../build_tmp/evalParser');
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

type LoaderType = (packageName: string) => (LoaderReturnType | Promise<LoaderReturnType>);

export type ParserType = {
	parse: (code: string) => ImportOrDefsystemObject[];
};

export type EvalParserType = {
	parse: (code: string) => EvaluableObject;
}

export default class Program {
	
	public scope: SystemScope | null = null;
	public readonly scopeMap = new Map<string, FileScope>();
	
	public static parser: ParserType = parser;
	public static evalParser: EvalParserType = evalParser;

	/**
	 * A temporary list used by {@link loadModuleInternal} method.
	 * 
	 * This is the list of filenames of the files with a temporary mark during a
	 * depth-first topological sort. Note that the file is considered to be
	 * marked with a permanent mark if {@code this.scopeMap} has the filename.
	 * 
	 * See https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search.
	 */
	private loadingModules: string[] | null = null;

	public async loadModule(filename: string, loader: LoaderType): Promise<SystemScope> {
		this.loadingModules = [];
		var fileScope = await this.loadModuleInternal(filename, loader);
		return this.scope = [...fileScope.systemMap.values()][0];
	}

	private async loadModuleInternal(filename: string, loader: LoaderType): Promise<FileScope> {
		// the file has a permanent mark
		if (this.scopeMap.has(filename)) {
			return this.scopeMap.get(filename)!;
		}

		if (!this.loadingModules) {
			throw Error('wut');
		}

		var loadingModuleIndex = this.loadingModules.indexOf(filename);

		// the file has a temporary mark
		if (loadingModuleIndex >= 0) {
			if (loadingModuleIndex == this.loadingModules.length - 1) {
				throw Error(`Cannot self import (${filename})`);
			}

			var cycle = this.loadingModules.slice(loadingModuleIndex).concat(filename);

			throw Error(`Circular import detected (${cycle.join(' -> ')}). Sadly, circular import is currently not supported.`);
		}

		// mark the file with a temporary mark
		this.loadingModules.push(filename);

		var {fileUri, code} = await loader(filename);

		var scope = new FileScope(fileUri || null);

		await this.feed(code, scope, loader);

		// remove temporary mark
		if (this.loadingModules.pop() != filename) {
			throw Error('Something\'s wrong');
		}

		// mark the file with a permanent mark
		this.scopeMap.set(filename, scope);
		return scope;
	}

	public async feed(code: string, scope: FileScope, loader: LoaderType) {
		var lines = parser.parse(code);

		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			
			switch (line._type) {
				case 'import':
					var imported = await this.loadModuleInternal(line.filename, loader);
					for (var importedSys of imported.systemMap.values()) {
						scope.importMap.set(importedSys.name, importedSys);
					}
					break;
				case 'defsystem':
					var sysScope = PegInterface.defsystem(line, scope);

					if (scope.hasSystem(sysScope.name)) {
						throw scope.error(`System ${sysScope.name} has already been declared`);
					}

					scope.addSystem(sysScope);
					break;
				default:
					throw Error(`Unknown line type ${(line as any)._type}`);
			}
		};
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
import { EvaluableObject, ImportOrDefsystemObject } from './PegInterfaceDefinitions';
import ProofExplorer from './ProofExplorer';
import FileScope from './scope/FileScope';
import Scope from './scope/Scope';
import SystemScope from './scope/SystemScope';
import StackTrace from './StackTrace';
