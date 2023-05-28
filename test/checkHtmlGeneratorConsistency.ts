import Program from '../src/Program';
import HtmlGenerator from '../src/HtmlGenerator';
import fs from 'fs';
import SchemaDecoration from '../src/decoration/SchemaDecoration';
var path = require('path');
var mkdirp = require('mkdirp');

var program = new Program();

function formatResult(result: {[k: string]: {[k: string]: string}}): string {
	var ret = '';

	for (let i in result) {
		ret += `${i}\n`;

		for (let j in result[i]) {
			ret += `\t${j}\n`;
			ret += `\t\t${result[i][j].replace(/\n/g, '\n\t\t')}\n`;
		}
	}

	return ret;
}

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
		await program.loadSystem('std.' + name, (fqn: string) => ({
			fileUri: 'math/' + fqn.replace(/\./g, '/') + '.math',
			code: fs.readFileSync(path.join(__dirname, '../math/' + fqn.replace(/\./g, '/') + '.math'), 'utf-8')
		}));

		var keys = [...program.scope!.variableMap].filter(([k, v]) => v.decoration instanceof SchemaDecoration).map(([k, v]) => k);

		result[name] = new HtmlGenerator(program, e => e, {render: e => e}).generate(
			name, keys, false
		);
	}

	var compareThis = formatResult(result);

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
			fs.closeSync(fs.openSync('logs/checkHtmlGeneratorConsistency.new.log', 'w'));
			fs.writeFileSync('logs/checkHtmlGeneratorConsistency.new.log', compareThis);

			throw Error('The current version is different from the previous one');
		}

		console.log('same');
	}
})();