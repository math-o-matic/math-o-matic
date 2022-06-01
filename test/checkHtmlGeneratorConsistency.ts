import Program from '../src/Program';
import HtmlGenerator from '../src/HtmlGenerator';
import fs from 'fs';
import SchemaDecoration from '../src/decoration/SchemaDecoration';
var path = require('path');
var mkdirp = require('mkdirp');

var program = new Program();

(async () => {
	var arr = [
		'Propositional', 'Predicate', 'Set',
		'Relation', 'Function', 'Natural',
		'Algebra', 'Integer'
	];

	var result: {
		[k: string]: {
			[k: string]: string
		}
	} = {};
	
	for (var name of arr) {
		await program.loadModule('std.' + name, (fqn: string) => ({
			fileUri: 'math/' + fqn.replace(/\./g, '/') + '.math',
			code: fs.readFileSync(path.join(__dirname, '../math/' + fqn.replace(/\./g, '/') + '.math'), 'utf-8')
		}));

		var keys = [...program.scope!.variableMap].filter(([k, v]) => v.decoration instanceof SchemaDecoration).map(([k, v]) => k);

		result[name] = new HtmlGenerator(program, e => e, {render: e => e}).generate(
			name, keys, false
		);
	}

	var compareThis = JSON.stringify(result, null, 4);

	mkdirp.sync('logs');
	var filename = 'logs/checkHtmlGeneratorConsistency.log'
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
			fs.closeSync(fs.openSync(filename + '.new', 'w'));
			fs.writeFileSync(filename + '.new', compareThis);

			throw Error('The current version is different from the previous one');
		}

		console.log('same');
	}
})();