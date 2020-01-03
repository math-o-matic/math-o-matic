var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');
var Rule = require('./Rule');
var Yield = require('./Yield');
var Rulecall = require('./Rulecall');
var Ruleset = require('./Ruleset');

var Translator = require('../Translator');

function Link({name, native, doc}) {
	Node.call(this);
	this._type = 'link';

	this.doc = doc;

	if (typeof name != 'string')
		throw Error(`Assertion failed`);

	if (!native)
		throw Error(`Assertion failed`);
	
	this.name = name;
	this.native = native || false;
}

Link.prototype = Object.create(Node.prototype);
Link.prototype.constructor = Link;

Link.prototype.toString = function () {
	return this.toIndentedString(0);
}

Link.prototype.toIndentedString = function (indent) {
	return `L ${this.name}`
		+ (this.native ? ' <native>' : ' <error>');
}

Link.prototype.toTeXString = function (root) {
	return `\\href{#link-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ (this.native ? '\\ (\\textrm{native})' : '\\ (\\textit{error})');
}

module.exports = Link;