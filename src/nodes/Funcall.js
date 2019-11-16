var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');

function Funcall({fun, args}) {
	Node.call(this);
	this._type = 'funcall';

	if (!(fun instanceof Node))
		throw Error(`Assertion failed`);

	if (!['typevar', 'fun', 'funcall'].includes(fun._type))
		throw Error(`Assertion failed`);

	if (!(args instanceof Array) || args.map(e => e instanceof Node).some(e => !e))
		throw Error(`Assertion failed`);
	
	this.fun = fun;
	this.type = fun.type.to;
	this.args = args;
}

Funcall.prototype = Object.create(Node.prototype);
Funcall.prototype.constructor = Funcall;

Funcall.prototype.toString = function () {
	return this.toIndentedString(0);
}

Funcall.prototype.toIndentedString = function (indent) {
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
			`${this.fun.anonymous ? '(' + this.fun.toIndentedString(indent) + ')' : this.fun.name}(`,
			args,
			`)`
		].join('')
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.fun.anonymous ? '(' + this.fun.toIndentedString(indent) + ')' : this.fun.name}(`,
			'\t' + args,
			`)`
		].join('\n' + '\t'.repeat(indent));
	}
}

Funcall.prototype.toTeXString = function (root) {
	if (this.fun instanceof Fun)
		return this.fun.funcallToTeXString(this.args);

	var args = this.args.map(arg => {
		return arg.toTeXString();
	});

	return `${this.fun.anonymous
			? this.fun.toTeXString()
			: this.fun._type == 'typevar'
				? this.fun.toTeXString()
				: this.fun.name.length == 1
					? this.escapeTeX(this.fun.name)
					: `\\mathrm{${this.escapeTeX(this.fun.name)}}`}`
		+ `(${args.join(', ')})`;
}


module.exports = Funcall;