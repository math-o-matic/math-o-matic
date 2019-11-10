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

function Link({name, code}) {
	this._type = 'link';
	
	this.name = name;
	this.code = code;
}

Link.prototype = Object.create(Node.prototype);
Link.prototype.constructor = Link;

Link.prototype.toString = function () {
	return this.toIndentedString(0);
}

Link.prototype.toIndentedString = function (indent) {
	return `L ${this.name}`;
}

Link.prototype.toTeXString = function (root) {
	return `\\href{#link-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`;
}

module.exports = Link;