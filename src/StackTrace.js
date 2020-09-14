'use strict';

function StackTrace(stack) {
	this.stack = stack || [];
}

StackTrace.prototype.extend = function (type, name, location) {
	return new StackTrace([[type, name, location]].concat(this.stack));
};

StackTrace.prototype.error = function (message) {
	var filename = typeof process != 'undefined' && process.argv[2];

	return new Error(
		message
		+ '\n\tat '
		+ (
			this.stack.length
				? this.stack.map(([type, name, location]) => {
					return `${type} ${name || '<anonymous>'} (${filename || '<unknown>'}:${location.start.line}:${location.start.column})`;
				}).join('\n\tat ')
				: `<root> (${filename || '<unknown>'}:1:1)`
		)
	);
};

module.exports = StackTrace;