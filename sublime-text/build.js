var fs = require('fs');
var path = require('path');
var math = require('..');
var pegjs = require('pegjs');
var esp = require('error-stack-parser');

if (!process.argv[2]) {
	throw Error('Filename not given');
}

function formatError(e) {
	var obj = esp.parse(e);
	if (e.location) {
		return `Error at (${process.argv[2]}:${e.location.start.line}:${e.location.start.column}): ${e.message}\n\n${e.stack}`;
	}

	return `Error at ${obj[0].functionName} (${obj[0].fileName}:${obj[0].lineNumber}:${obj[0].columnNumber}): ${e.message}\n\n${e.stack}`;
}

var code = fs.readFileSync(process.argv[2], 'utf-8');

try {
	var parser = pegjs.generate(math.grammar, {cache: true});
	var parsed = parser.parse(code);
	program = new math.Program(parser);
	program.feed(parsed);
} catch (e) {
	console.error(formatError(e));
	return;
}