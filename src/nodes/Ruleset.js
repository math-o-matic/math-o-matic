var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');
var Rule = require('./Rule');
var Yield = require('./Yield');
var Rulecall = require('./Rulecall');

var Translator = require('../Translator');

function Ruleset({name, native, code, doc}) {
	Node.call(this);
	this._type = 'ruleset';

	this.doc = doc;

	if (typeof name != 'string')
		throw Error(`Assertion failed`);

	if (typeof native != 'boolean' || !native)
		throw Error(`Assertion failed`);

	if (!code)
		throw Error(`Assertion failed`);
	
	this.name = name;
	this.native = native;
	this.code = code;
}

Ruleset.prototype = Object.create(Node.prototype);
Ruleset.prototype.constructor = Ruleset;

Ruleset.prototype.toString = function () {
	return this.toIndentedString(0);
}

Ruleset.prototype.toIndentedString = function (indent) {
	return `RS ${this.name}`
		+ (this.native ? ' <native>' : '');
}

Ruleset.prototype.toTeXString = function (root) {
	return `\\href{#ruleset-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ (this.native ? '\\ (\\mathrm{native})' : '');
}

module.exports = Ruleset;