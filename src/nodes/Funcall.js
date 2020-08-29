var Node = require('./Node');
var Typevar = require('./Typevar');
var Fun = require('./Fun');

function Funcall({fun, args}, scope, trace) {
	Node.call(this, trace);

	if (!(fun instanceof Node))
		throw this.error('Assertion failed');

	if (!['typevar', 'fun', 'funcall'].includes(fun._type))
		throw this.error('Assertion failed');

	if (fun.type.isSimple)
		throw this.error(`${fun.name} is not callable`);

	if (!(args instanceof Array) || args.map(e => e instanceof Node).some(e => !e))
		throw this.error('Assertion failed');

	var resolvedType = fun.type.resolve(),
		paramTypes = resolvedType.from,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw this.error(`Illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
	}
	
	this.fun = fun;
	this.type = resolvedType.to;
	this.args = args;
}

Funcall.prototype = Object.create(Node.prototype);
Funcall.prototype.constructor = Funcall;
Funcall.prototype._type = 'funcall';

Funcall.prototype.toString = function () {
	return this.toIndentedString(0);
};

Funcall.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		args = this.args.map(arg => {
			if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.fun._type != 'fun' || !this.fun.name ? '(' + this.fun.toIndentedString(indent) + ')' : this.fun.name}(`,
			args,
			')'
		].join('');
	} else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.fun._type != 'fun' || !this.fun.name ? '(' + this.fun.toIndentedString(indent) + ')' : this.fun.name}(`,
			'\t' + args,
			')'
		].join('\n' + '\t'.repeat(indent));
	}
};

Funcall.prototype.toTeXString = function (root) {
	if (this.fun instanceof Fun)
		return this.fun.funcallToTeXString(this.args);

	var args = this.args.map(arg => {
		return arg.toTeXString();
	});

	return `${!this.fun.name
			? this.fun.toTeXString()
			: this.fun._type == 'typevar'
				? this.fun.toTeXString()
				: this.fun.name.length == 1
					? this.escapeTeX(this.fun.name)
					: `\\mathrm{${this.escapeTeX(this.fun.name)}}`}`
		+ `(${args.join(', ')})`;
};


module.exports = Funcall;