var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');
var Rule = require('./Rule');

var Translator = require('../Translator');

function Yield({left, right}) {
	this._type = 'yield';
	
	if (!left || !right) throw Error('Missing required argument');

	// remove duplicates
	this.left = left.reduce((l, r) => {
		for (var i = 0; i < l.length; i++)
			if (Translator.expr0Equals(l[i], r)) return l;

		return l.push(r), l;
	}, []);

	this.right = right;
}

Yield.prototype = Object.create(Node.prototype);
Yield.prototype.constructor = Yield;

Yield.prototype.toString = function () {
	return this.toIndentedString(0);
}

Yield.prototype.toIndentedString = function (indent) {
	if (!this.left.length) {
		return '|- ' + (
			this.right instanceof Typevar
			? this.right.name
			: this.right.toIndentedString(indent)
		);
	}

	return [
		this.left.map(e => (
			e instanceof Typevar
			? e.name
			: e.toIndentedString(indent)
		)).join(',\n' + '\t'.repeat(indent)),
		'|-',
		'\t' + (
			this.right instanceof Typevar
			? this.right.name
			: this.right.toIndentedString(indent + 1)
		)
	].join('\n' + '\t'.repeat(indent));
}

Yield.prototype.toTeXString = function () {
	if (!this.left.length)
		return `\\ \\vdash ${this.right.toTeXString()}`;
	
	return `${this.left.map(e => e.toTeXString()).join(', ')} \\vdash ${this.right.toTeXString()}`;
}

module.exports = Yield;