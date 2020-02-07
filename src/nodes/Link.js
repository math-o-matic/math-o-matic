var Node = require('./Node');

function Link({name, native, doc}) {
	Node.call(this);

	this.doc = doc;

	if (typeof name != 'string')
		throw Error('Assertion failed');

	if (!native)
		throw Error('Assertion failed');
	
	this.name = name;
	this.native = native || false;
}

Link.prototype = Object.create(Node.prototype);
Link.prototype.constructor = Link;
Link.prototype._type = 'link';

Link.prototype.toString = function () {
	return this.toIndentedString(0);
};

Link.prototype.toIndentedString = function (indent) {
	return `L ${this.name}`
		+ (this.native ? ' <native>' : ' <error>');
};

Link.prototype.toTeXString = function (root) {
	return `\\href{#link-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ (this.native ? '\\ (\\textrm{native})' : '\\ (\\textit{error})');
};

module.exports = Link;