'use strict';

function StackTrace(stack) {
	this.stack = stack || [];
}

StackTrace.prototype.extend = function (type, name, location) {
	return new StackTrace([[type, name, location]].concat(this.stack));
}

StackTrace.prototype.error = function (message) {
	return new Error(
		message
		+ '\n\tat ' + this.stack.map(([type, name, location]) => {
			return `${type} ${name || '<anonymous>'} (code.js:${location.start.line}:${location.start.column})`;
		}).join('\n\tat ')
	);
}

module.exports = StackTrace;