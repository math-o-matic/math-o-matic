var Node = require('./Node');
var MetaType = require('./MetaType');

var ExpressionResolver = require('../ExpressionResolver');

function Tee({left, right}) {
	Node.call(this);

	if (!(left instanceof Array)) {
		console.log(left);
		throw Error('Assertion failed');
	}

	if (!right)
		throw Error('Assertion failed');

	// antecedent의 contraction
	// 현재 antecedent를 집합처럼 생각하므로 contraction을 자동으로 한다.
	// antecedent가 집합인지 시퀀스인지는 #14 참조.
	this.left = left.reduce((l, r) => {
		for (var i = 0; i < l.length; i++)
			if (ExpressionResolver.equals0(l[i], r)) return l;

		return l.push(r), l;
	}, []);

	this.right = right;

	this.type = new MetaType({
		functional: false,
		left: left.map(e => e.type),
		right: right.type
	});
}

Tee.prototype = Object.create(Node.prototype);
Tee.prototype.constructor = Tee;
Tee.prototype._type = 'tee';

Tee.prototype.toString = function () {
	return this.toIndentedString(0);
};

Tee.prototype.toIndentedString = function (indent) {
	if (!this.left.length) {
		return '|- ' + this.right.toIndentedString(indent);
	}

	return [
		this.left.map(e => e.toIndentedString(indent)).join(',\n' + '\t'.repeat(indent)),
		'|-',
		'\t' + this.right.toIndentedString(indent + 1)
	].join('\n' + '\t'.repeat(indent));
};

Tee.prototype.toTeXString = function (root) {
	return `\\left({${this.left.map(e => e.toTeXString()).join(', ')} \\vdash ${this.right.toTeXString()}}\\right)`;
};

module.exports = Tee;