var Node = require('./Node');
var Type = require('./Type');

/*
 * name, expr 중 하나 이상 있어야 하고 type, expr 중
 * 한 개만 있어야 한다.
 */
function Fun({name, type, params, expr, doc, tex}, scope, trace) {
	Node.call(this, trace);

	this.doc = doc;
	this.tex = tex;

	if (!name && !expr)
		throw this.error('Anonymous fun cannot be primitive');

	if (type && expr)
		throw this.error('no');

	if (!type && !expr)
		throw this.error('Cannot guess the type of a primitive fun');

	if (name !== null && typeof name != 'string')
		throw this.error('Assertion failed');

	if (type && type._type != 'type')
		throw this.error('Assertion failed');

	if (!(params instanceof Array)
			|| params.map(e => e instanceof Node).some(e => !e))
		throw this.error('Assertion failed');

	if (expr !== null && !(expr instanceof Node))
		throw this.error('Assertion failed');

	this.name = name;
	this.type = type || new Type({
		functional: true,
		from: params.map(typevar => typevar.type),
		to: expr.type
	});
	this.params = params;
	this.expr = expr;
}

Fun.prototype = Object.create(Node.prototype);
Fun.prototype.constructor = Fun;
Fun.prototype._type = 'fun';

Fun.prototype.toString = function () {
	return this.toIndentedString(0);
};

Fun.prototype.toIndentedString = function (indent) {
	if (!this.expr)
		return `ƒ ${this.type.to} ${this.name}(${this.params.join(', ')});`;

	return [
		(this.name ? 'ƒ ' + this.type.to + ' ' + this.name : 'ƒ ')
			+ `(${this.params.join(', ')}) => {`,
		`\t${this.expr.toIndentedString(indent + 1)}`,
		'}'
	].join('\n' + '\t'.repeat(indent));
};

Fun.prototype.toTeXString = function (root) {
	if (!this.name) {
		return '\\left('
			+ (
				this.params.length == 1
				? this.params[0].toTeXString()
				: `\\left(${this.params.map(e => e.toTeXString()).join(', ')}\\right)`
			)
			+ `\\mapsto ${this.expr.toTeXString()}\\right)`;
	}

	if (!root)
		return `\\href{#def-${this.name}}\\mathrm{${this.escapeTeX(this.name)}}`;

	if (!this.expr)
		return this.funcallToTeXString(this.params);

	return this.funcallToTeXString(this.params)
			+ `:= ${this.expr.toTeXString()}`;
};

Fun.prototype.funcallToTeXString = function (args) {
	args = args.map(arg => {
		return arg.toTeXString();
	});

	if (this.tex) {
		return this.makeTeX('def-' + this.name, args);
	}

	return `${!this.name
			? this.toTeXString()
			: `\\href{#def-${this.name}}{${this.name.length == 1 ? this.escapeTeX(this.name) : `\\mathrm{${this.escapeTeX(this.name)}}`}}`}`
		+ `(${args.join(', ')})`;
};

module.exports = Fun;