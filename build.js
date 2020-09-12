var fs = require('fs');
var path = require('path');
var math = require('.');
var esp = require('error-stack-parser');

if (!process.argv[2]) {
	throw Error('Filename not given');
}

function formatError(e) {
	var obj = esp.parse(e);
	if (e.location) {
		return `Error at (${process.argv[2]}:${e.location.start.line}:${e.location.start.column}): ${e.message}`;
	}

	return `Error at ${obj[0].functionName} (${obj[0].fileName}:${obj[0].lineNumber}:${obj[0].columnNumber}): ${e.message}`;
}

var code = fs.readFileSync(process.argv[2], 'utf-8');
var native = require(path.join(path.dirname(process.argv[2]), 'native.js'));

try {
	var parsed = math.parser.parse(code);
	program = new math.Program(process.argv[2]);
	program.feed(parsed, native);
} catch (e) {
	console.error(formatError(e));
	return;
}