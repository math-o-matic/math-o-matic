'use strict';

function StackTrace(stack, filename) {
	this.stack = stack || [];
	this.filename = filename || null;
}

StackTrace.prototype.extend = function (type, name, location) {
	return new StackTrace([[type, name, location]].concat(this.stack), this.filename);
};

StackTrace.prototype.error = function (message) {
	return new Error(
		message
		+ '\n\tat ' + this.stack.map(([type, name, location]) => {
			return `${type} ${name || '<anonymous>'} (${this.filename || '<unknown>'}:${location.start.line}:${location.start.column})`;
		}).join('\n\tat ')
	);
};

module.exports = StackTrace;