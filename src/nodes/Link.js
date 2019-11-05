var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');
var Rule = require('./Rule');
var Yield = require('./Yield');
var Rulecall = require('./Rulecall');

var Translator = require('../Translator');

function Link({name, params, rules}) {
	this._type = 'link';
	
	this.name = name;
	this.params = params;
	this.rules = rules;

	// all yields
	var expands = this.rules.map(Translator.expand1);

	var expr = expands.reduce((l, r) => {
		for (var i = 0; i < r.left.length; i++) {
			if (Translator.expr0Equals(l.right, r.left[i])) {
				var newleft = r.left.slice(0, i)
					.concat(l.left)
					.concat(r.left.slice(i + 1));

				return new Yield({
					left: newleft.map(Translator.expand0Funcalls),
					right: Translator.expand0Funcalls(r.right)
				});
			}
		}

		throw Error(`Link ${name} failed:\n\n${l},\n\n${r}\n`);
	});

	this.result = expr;
}

Link.prototype.toString = function () {
	return this.toIndentedString(0);
}

Link.prototype.toIndentedString = function (indent) {
	return [
		`L ${this.name}(${this.params.join(', ')}) =>`,
		'\t\t' + this.rules
			.map(e => e.toIndentedString(indent + 2))
			.join('\n' + '\t'.repeat(indent + 1) + '~' + '\n' + '\t'.repeat(indent + 2)),
		`\t=`,
		'\t\t' + this.result.toIndentedString(indent + 2)
	].join('\n' + '\t'.repeat(indent));
}

Link.prototype.toTeXString = function () {
	return `\\mathsf{${this.name}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')})`;
}

module.exports = Link;