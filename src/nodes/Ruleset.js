var Node = require('./Node');

function Ruleset({axiomatic, name, native, doc}, scope, trace) {
	Node.call(this, trace);

	this.doc = doc;

	if (typeof name != 'string')
		throw this.error('Assertion failed');

	if (!native)
		throw this.error('Assertion failed');
	
	this.axiomatic = axiomatic;
	this.name = name;
	this.native = native || false;
}

Ruleset.prototype = Object.create(Node.prototype);
Ruleset.prototype.constructor = Ruleset;
Ruleset.prototype._type = 'ruleset';

Ruleset.prototype.isProved = function (hyps) {
	hyps = hyps || [];
	
	return Node.prototype.isProved.call(this, hyps)
		|| this.axiomatic;
};

Ruleset.prototype.toString = function () {
	return this.toIndentedString(0);
};

Ruleset.prototype.toIndentedString = function (indent) {
	return `RS ${this.name}`
		+ (this.native ? ' <native>' : ' <error>');
};

Ruleset.prototype.toTeXString = function (prec, root) {
	return `\\href{#ruleset-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ (this.native ? '\\ (\\textrm{native})' : '\\ (\\textit{error})');
};

module.exports = Ruleset;