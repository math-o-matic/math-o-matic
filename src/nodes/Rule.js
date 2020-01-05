var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');
var Yield = require('./Yield');
var Rulecall = require('./Rulecall');

var Translator = require('../Translator');

function Rule({name, params, rules, doc}) {
	Node.call(this);

	this.doc = doc;

	if (typeof name != 'string')
		throw Error(`Assertion failed`);

	if (!(params instanceof Array)
			|| params.map(e => e._type == 'typevar').some(e => !e))
		throw Error(`Assertion failed`);

	if (!(rules instanceof Array)
			|| rules.map(e => e instanceof Node).some(e => !e))
		throw Error(`Assertion failed`);
	
	this.name = name;
	this.params = params;
	this.rules = rules;

	var expands = rules.map(Translator.expand1);

	if (expands.map(e => e._type == 'yield').some(e => !e))
		throw Error(`Assertion failed`);

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

	return Translator.expand1Funcalls(this.expands.slice(i, j + 1).reduceRight((r, l) => {
		for (var i = 0; i < r.left.length; i++) {
			if (Translator.expr0Equals(l.right, r.left[i])) {
				var newleft = r.left.slice(0, i)
					.concat(l.left)
					.concat(r.left.slice(i + 1));

				return new Yield({
					left: newleft,
					right: r.right
				});
			}
		}

		throw Error(`Link ${this.name} failed:\n\n${l},\n\n${r}\n`);
	}));
}

Rule.prototype.toString = function () {
	return this.toIndentedString(0);
}

Rule.prototype.toIndentedString = function (indent) {
	return [
		`R ${this.name}(${this.params.join(', ')}) =>`,
		'\t\t' + this.rules
			.map(e => e.toIndentedString(indent + 2))
			.join('\n' + '\t'.repeat(indent + 1) + '~' + '\n' + '\t'.repeat(indent + 2)),
		`\t=`,
		'\t\t' + this.expr.toIndentedString(indent + 2)
	].join('\n' + '\t'.repeat(indent));
}

Rule.prototype.toTeXString = function (root) {
	return `\\href{#rule-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')}):`
		+ '\\\\\\quad' + this.expr.toTeXString();
}

module.exports = Rule;