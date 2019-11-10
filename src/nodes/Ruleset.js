var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');
var Rule = require('./Rule');
var Yield = require('./Yield');
var Rulecall = require('./Rulecall');

var Translator = require('../Translator');

function Ruleset({name, code}) {
	this._type = 'ruleset';
	
	this.name = name;
	this.code = code;
}

Ruleset.prototype = Object.create(Node.prototype);
Ruleset.prototype.constructor = Ruleset;

Ruleset.prototype.toString = function () {
	return this.toIndentedString(0);
}

Ruleset.prototype.toIndentedString = function (indent) {
	return `RS ${this.name}`;
}

Ruleset.prototype.toTeXString = function (root) {
	return `\\href{#ruleset-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`;
}

module.exports = Ruleset;