import { PFile } from "./ParseTreeDefinitions";
import FileCollection from "../1-path-to-file/FileCollection";
import parser from "./Parser";

/**
 * A collection of lazily loaded parse trees.
 */
export default class ParseTreeCollection {

	private fileCollection: FileCollection;
	private parseTreeCache: Map<string, PFile> = new Map();

	constructor (fileCollection: FileCollection) {
		this.fileCollection = fileCollection;
	}

	public filenames(): string[] {
		return this.fileCollection.filenames();
	}

	public has(filename: string): boolean {
		return this.fileCollection.has(filename);
	}

	public async get(filename: string): Promise<PFile> {
		if (this.parseTreeCache.has(filename)) {
			return this.parseTreeCache.get(filename)!;
		}

		var file = await this.fileCollection.get(filename);

		var ret = parser.parse(file);
		this.parseTreeCache.set(filename, ret);
		return ret;
	}
}