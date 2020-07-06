var Node = require('./Node');
var MetaType = require('./MetaType');
var Typevar = require('./Typevar');
var Rule = require('./Rule');

var ExpressionResolver = require('../ExpressionResolver');

function Rulecall({rule, args}) {
	Node.call(this);

	if (!(rule.type._type == 'metatype'
			&& rule.type.order == 1
			&& rule.type.isFunctional)) {
		throw Error('rule should be a first-order functional type');
	}

	if (!(args instanceof Array) || args.some(e => e.type.order != 0))
		throw Error('Assertion failed');
	
	this.rule = rule;
	this.args = args;

	var paramTypes = rule.type.from,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw Error('Assertion failed');

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw Error('Assertion failed');
	}

	this.type = rule.type.to;

	this.expanded = ExpressionResolver.expand1Funcalls(this);
}

Rulecall.prototype = Object.create(Node.prototype);
Rulecall.prototype.constructor = Rulecall;
Rulecall.prototype._type = 'rulecall';

Rulecall.prototype.toString = function () {
	return this.toIndentedString(0);
};

Rulecall.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		args = this.args.map(arg => {
			if (arg instanceof Typevar) return arg.name;
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.rule.name}(`,
			args,
			')'
		].join('');
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.rule.name}(`,
			'\t' + args,
			')'
		].join('\n' + '\t'.repeat(indent));
	}
};

Rulecall.prototype.toTeXString = function (root) {
	if (!this.rule.name)
		return this.rule.toTeXString()
	+ `(${this.args.map(e => e.toTeXString()).join(', ')})`;

	return `\\href{#rule-${this.rule.name}}{\\textsf{${this.escapeTeX(this.rule.name)}}}`
	+ `(${this.args.map(e => e.toTeXString()).join(', ')})`;
};

module.exports = Rulecall;