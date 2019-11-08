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
Ruleset.prototype.constructor = Rule;

Ruleset.prototype.toString = function () {
	return this.toIndentedString(0);
}

Ruleset.prototype.toIndentedString = function (indent) {
	return [
		`R ${this.name}(${this.params.join(', ')}) =>`,
		'\t\t' + this.rules
			.map(e => e.toIndentedString(indent + 2))
			.join('\n' + '\t'.repeat(indent + 1) + '~' + '\n' + '\t'.repeat(indent + 2)),
		`\t=`,
		'\t\t' + this.expr.toIndentedString(indent + 2)
	].join('\n' + '\t'.repeat(indent));
}

Ruleset.prototype.toTeXString = function (root) {
	return `\\href{#rule-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')}):`
		+ (
			this.rules.length > 1 || true
			? '\\\\\\ \\ \\ \\ '
				+ this.rules.map(e => e.toTeXString()).join('\\\\\\ \\ \\ \\ \\sim ')
				+ '\\\\\\ \\ \\ \\ = '
			: '\\\\\\ \\ \\ \\ '
		)
		+ this.expr.toTeXString();
}

module.exports = Ruleset;