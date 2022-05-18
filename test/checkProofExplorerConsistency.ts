import Program from '../src/Program';
import ProofExplorer from '../src/ProofExplorer';
import fs from 'fs';
var path = require('path');
var mkdirp = require('mkdirp');

var program = new Program();

(async () => {
	var arr = [
		'propositional', 'predicate', 'set',
		'relation', 'function', 'natural',
		'algebra', 'integer'
	];

	var proofs = {};
	
	for (var name of arr) {
		await program.loadModule(name, (filename: string) => ({
			fileUri: filename + '.math',
			code: fs.readFileSync(path.join(__dirname, '../math/' + filename + '.math'), 'utf-8')
		}));

		var keys = [...program.scope.schemaMap.keys()];

		for (var key of keys) {
			var proof = ProofExplorer.get(program.scope, key, e => e, {render: e => e});
			proofs[key] = proof;
		}
	}

	var compareThis = JSON.stringify(proofs);

	mkdirp.sync('logs');
	var filename = 'logs/checkProofExplorerConsistency.log'
	if (!fs.existsSync(filename)) {
		console.log('Previous version not found; creating a new one');
		fs.closeSync(fs.openSync(filename, 'w'));
		fs.writeFileSync(filename, compareThis);
	} else {
		var withThis = fs.readFileSync(filename, 'utf-8');
		if (!withThis.trim()) {
			throw Error('The previous version is empty');
		}

		if (compareThis != withThis) {
			throw Error('The current version is different from the previous one');
		}

		console.log('same');
	}
})();