var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');
var Funcall = require('./Funcall');

function Rulecall({rule, args}) {
	this._type = 'rulecall';
	
	if (!rule || !args) throw Error('Missing required argument');
	this.rule = rule;
	this.args = args;
}

Rulecall.prototype = Object.create(Node.prototype);
Rulecall.prototype.constructor = Rulecall;

Rulecall.prototype.toString = function () {
	return this.toIndentedString(0);
}

Rulecall.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		var args = this.args.map(arg => {
			if (arg instanceof Typevar) return arg.name;
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.rule.name}(`,
			args,
			`)`
		].join('')
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.rule.name}(`,
			'\t' + args,
			`)`
		].join('\n' + '\t'.repeat(indent));
	}
}

Rulecall.prototype.toTeXString = function () {
	return `\\textsf{${this.escapeTeX(this.rule.name)}}(${this.args.map(e => e.toTeXString()).join(', ')})`
}

module.exports = Rulecall;