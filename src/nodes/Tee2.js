var Node = require('./Node');
var MetaType = require('./MetaType');
var Typevar = require('./Typevar');

var ExpressionResolver = require('../ExpressionResolver');

function Tee2({left, right}) {
	Node.call(this);

	if (!(left instanceof Array)
			|| left.map(e => e.type.order == 1).some(e => !e))
		throw Error('Assertion failed');

	if (right.type.order != 1)
		throw Error('Assertion failed');

	this.left = left;
	this.right = right;

	this.type = new MetaType({
		functional: false,
		order: 2,
		left: left.map(e => e.type),
		right: right.type
	});
}

Tee2.prototype = Object.create(Node.prototype);
Tee2.prototype.constructor = Tee2;
Tee2.prototype._type = 'tee2';

Tee2.prototype.toString = function () {
	return this.toIndentedString(0);
};

Tee2.prototype.toIndentedString = function (indent) {
	if (!this.left.length) {
		return '||- ' + this.right.toIndentedString(indent);
	}

	return [
		this.left.map(e => e.toIndentedString(indent)).join(',\n' + '\t'.repeat(indent)),
		'||-',
		'\t' + this.right.toIndentedString(indent + 1)
	].join('\n' + '\t'.repeat(indent));
};

Tee2.prototype.toTeXString = function (root) {
	if (!this.left.length)
		return `\\ \\Vdash ${this.right.toTeXString()}`;
	
	return `${this.left.map(e => e.toTeXString()).join('; ')} \\Vdash ${this.right.toTeXString()}`;
};

module.exports = Tee2;