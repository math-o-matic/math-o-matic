var Node = require('./Node');
var Typevar = require('./Typevar');

var ExpressionResolver = require('../ExpressionResolver');

function Yield({left, right}) {
	Node.call(this);

	if (!(left instanceof Array)
			|| left.map(e => e instanceof Node).some(e => !e))
		throw Error('Assertion failed');

	if (!(right instanceof Node))
		throw Error('Assertion failed');

	// remove duplicates
	this.left = left.reduce((l, r) => {
		for (var i = 0; i < l.length; i++)
			if (ExpressionResolver.equals0(l[i], r)) return l;

		return l.push(r), l;
	}, []);

	this.right = right;
}

Yield.prototype = Object.create(Node.prototype);
Yield.prototype.constructor = Yield;
Yield.prototype._type = 'yield';

Yield.prototype.toString = function () {
	return this.toIndentedString(0);
};

Yield.prototype.toIndentedString = function (indent) {
	if (!this.left.length) {
		return '|- ' + this.right.toIndentedString(indent);
	}

	return [
		this.left.map(e => e.toIndentedString(indent)).join(',\n' + '\t'.repeat(indent)),
		'|-',
		'\t' + this.right.toIndentedString(indent + 1)
	].join('\n' + '\t'.repeat(indent));
};

Yield.prototype.toTeXString = function (root) {
	if (!this.left.length)
		return `\\ \\vdash ${this.right.toTeXString()}`;
	
	return `${this.left.map(e => e.toTeXString()).join(', ')} \\vdash ${this.right.toTeXString()}`;
};

module.exports = Yield;