var Type = require('./Type');
var Typevar = require('./Typevar');
var Fun = require('./Fun');

function Funcall({fun, args}) {
	this._type = 'funcall';
	
	if (!fun || !args) throw Error('Missing required argument');
	this.fun = fun;
	this.type = fun.type.to;
	this.args = args;
}

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
			`${this.fun.anonymous ? '(' + this.fun + ')' : this.fun.name}(`,
			args,
			`)`
		].join('')
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.fun.anonymous ? '(' + this.fun + ')' : this.fun.name}(`,
			'\t' + args,
			`)`
		].join('\n' + '\t'.repeat(indent));
	}
}

Funcall.prototype.toTeXString = function () {
	if (this.fun instanceof Fun)
		return this.fun.funcallToTeXString(this.args);

	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toTeXString();
	});

	return `${this.fun.anonymous
			? '(' + this.fun.toTeXString() + ')'
			: `${this.fun.name.length == 1 ? this.fun.name : `\\mathrm{${this.fun.name}}`}`}`
		+ `(${args.join(', ')})`;
}


module.exports = Funcall;