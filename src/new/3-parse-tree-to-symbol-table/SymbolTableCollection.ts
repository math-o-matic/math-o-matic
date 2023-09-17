import ParseTreeCollection from "../2-file-to-parse-tree/ParseTreeCollection";
import NameResolver from "./NameResolver";
import type { SymbolTable } from "./SymbolTableDefinitions";
import StackTrace from "./util/StackTrace";

/**
 * A collection of lazily loaded (unlinked) symbol tables.
 */
export default class SymbolTableCollection {

	private parseTreeCollection: ParseTreeCollection;
	private symbolTableCache: Map<string, SymbolTable> = new Map();

	constructor (parseTreeCollection: ParseTreeCollection) {
		this.parseTreeCollection = parseTreeCollection;
	}

	public filenames(): string[] {
		return this.parseTreeCollection.filenames();
	}

	public has(filename: string): boolean {
		return this.parseTreeCollection.has(filename);
	}

	public async get(filename: string): Promise<SymbolTable> {
		if (this.symbolTableCache.has(filename)) {
			return this.symbolTableCache.get(filename)!;
		}

		var file = await this.parseTreeCollection.get(filename);

		var ret = new NameResolver(file).resolve(new StackTrace(filename));
		this.symbolTableCache.set(filename, ret);
		return ret;
	}
}