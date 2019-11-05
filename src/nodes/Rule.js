var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');

function Rule({name, params, expr}) {
	this._type = 'rule';
	
	this.name = name;
	this.params = params;
	this.expr = expr;
}

Rule.prototype.toString = function () {
	return this.toIndentedString(0);
}

Rule.prototype.toIndentedString = function (indent) {
	return [
		`R ${this.name}(${this.params.join(', ')}) =>`,
		`\t${this.expr.toIndentedString(indent + 1)}`
	].join('\n' + '\t'.repeat(indent));
}

Rule.prototype.toTeXString = function () {
	return `\\mathsf{${this.name}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')})`
		+ `\\coloneqq ` + this.expr.toTeXString();
}

module.exports = Rule;