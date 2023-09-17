export type FileReader = (path: string) => string | Promise<string>;

/**
 * A collection of lazily loaded files.
 */
export default class FileCollection {

	private paths: string[];
	private fileReader: FileReader;
	private fileCache: Map<string, string> = new Map();

	constructor (paths: string[], fileReader: FileReader) {
		this.paths = paths;
		this.fileReader = fileReader;
	}

	public filenames(): string[] {
		return this.paths.slice();
	}

	public has(filename: string): boolean {
		return this.paths.includes(filename);
	}

	public async get(filename: string): Promise<string> {
		if (this.fileCache.has(filename)) {
			return this.fileCache.get(filename)!;
		}

		if (!this.has(filename)) {
			throw Error(`File ${filename} not found`);
		}

		var ret = await this.fileReader(filename)!;
		this.fileCache.set(filename, ret);
		return ret;
	}
}