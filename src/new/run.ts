import fs from 'fs';
import glob from 'glob';
import typia from 'typia';

import FileCollection from './1-path-to-file/FileCollection';
import ParseTreeCollection from './2-file-to-parse-tree/ParseTreeCollection';
import { PFile } from './2-file-to-parse-tree/ParseTreeDefinitions';
import SymbolTableCollection from './3-parse-tree-to-symbol-table/SymbolTableCollection';

(async () => {

var fileCollection = new FileCollection(
	glob.sync('./math/**/*.math'),
	(filename: string) => {
		return new Promise((resolve, reject) => {
			fs.readFile(filename, 'utf-8', (err, data) => {
				if (err) reject(err);
				resolve(data);
			});
		});
	}
);

var parseTreeCollection = new ParseTreeCollection(fileCollection);

var assertPFile = typia.createAssert<PFile>();

for (let filename of parseTreeCollection.filenames()) {
	assertPFile(await parseTreeCollection.get(filename));
}

var symbolTableCollection = new SymbolTableCollection(parseTreeCollection);

for (let filename of symbolTableCollection.filenames()) {
	console.log(filename);
	var table = await symbolTableCollection.get(filename);
	table.forEach((symbol, i) => {
		if (symbol._id != i) {
			throw Error(`_id does not match with the index`);
		}
	});
}

})();