var Node = require('./Node');
var Type = require('./Type');
var Typevar = require('./Typevar');

function Fun({anonymous, name, type, atomic, params, expr}) {
	this._type = 'fun';
	
	if (!atomic && (!params || !expr))
		throw Error(`Non-atomic function without params or expr`);
	this.anonymous = anonymous;
	this.name = anonymous ? '<anonymous>' : name;
	this.type = type;
	this.atomic = atomic;
	this.params = params;
	this.expr = expr;
}

Fun.prototype = Object.create(Node.prototype);
Fun.prototype.constructor = Fun;

Fun.prototype.toString = function () {
	return this.toIndentedString(0);
};

Fun.prototype.toIndentedString = function (indent) {
	if (!this.expr)
		return `${this.anonymous ? '' : 'ƒ ' + this.type.to + ' ' + this.name}`
			+ `(${this.params.join(', ')});`;

	return [
		`${this.anonymous ? '' : 'ƒ ' + this.type.to + ' ' + this.name}`
			+ `(${this.params.join(', ')}) => (`,
		`\t${this.expr.toIndentedString(indent + 1)}`,
		')'
	].join('\n' + '\t'.repeat(indent));
}

Fun.prototype.toTeXString = function () {
	if (this.anonymous)
		return `\\left(`
			+ (
				this.params.length == 1
				? this.params[0].toTeXString()
				: `\\left(${this.params.map(e => e.toTeXString()).join(', ')}\\right)`
			)
			+ `\\mapsto ${this.expr.toTeXString()}\\right)`;

	if (!this.expr)
		return this.funcallToTeXString(this.params);

	return this.funcallToTeXString(this.params)
			+ `:= ${this.expr.toTeXString()}`;
}

Fun.prototype.funcallToTeXString = function (args) {
	var args = args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toTeXString();
	});

	var n = this.escapeTeX(this.name);

	return `${this.anonymous
			? '(' + this.toTeXString() + ')'
			: `${this.name.length == 1 ? n : `\\mathrm{${n}}`}`}`
		+ `(${args.join(', ')})`;
}

module.exports = Fun;