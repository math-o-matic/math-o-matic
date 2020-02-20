var Node = require('./Node');
var Tee = require('./Tee');

var ExpressionResolver = require('../ExpressionResolver');

function Rule({name, params, rules, doc}) {
	Node.call(this);

	this.doc = doc;

	if (typeof name != 'string')
		throw Error('Assertion failed');

	if (!(params instanceof Array)
			|| params.map(e => e._type == 'typevar').some(e => !e))
		throw Error('Assertion failed');

	if (!(rules instanceof Array)
			|| rules.map(e => e instanceof Node).some(e => !e))
		throw Error('Assertion failed');
	
	this.name = name;
	this.params = params;
	this.rules = rules;

	var expands = rules.map(ExpressionResolver.expand1);

	if (expands.map(e => e._type == 'tee').some(e => !e))
		throw Error('Assertion failed');

	this.expands = expands;

	this.expr = this.chain();
}

Rule.prototype = Object.create(Node.prototype);
Rule.prototype.constructor = Rule;
Rule.prototype._type = 'rule';

// indices both inclusive & zero-based
// indices invertible
Rule.prototype.chain = function (i, j) {
	if (typeof i == 'undefined') i = 0;
	if (typeof j == 'undefined') j = this.expands.length - 1;

	[i, j] = i <= j ? [i, j] : [j, i];

	try {
		return ExpressionResolver.chain(this.expands.slice(i, j + 1));
	} catch (err) {
		err.message = `Chaining failed for rule ${this.name}: ` + err.message;
		throw err;
	}
};

Rule.prototype.toString = function () {
	return this.toIndentedString(0);
};

Rule.prototype.toIndentedString = function (indent) {
	return [
		`R ${this.name}(${this.params.join(', ')}) =>`,
		'\t\t' + this.rules
			.map(e => e.toIndentedString(indent + 2))
			.join('\n' + '\t'.repeat(indent + 1) + '~' + '\n' + '\t'.repeat(indent + 2)),
		'\t=',
		'\t\t' + this.expr.toIndentedString(indent + 2)
	].join('\n' + '\t'.repeat(indent));
};

Rule.prototype.toTeXString = function (root) {
	return `\\href{#rule-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')}):`
		+ '\\\\\\quad' + this.expr.toTeXString();
};

module.exports = Rule;