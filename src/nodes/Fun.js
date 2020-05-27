var Node = require('./Node');

function Fun({name, type, params, expr, doc, tex}) {
	Node.call(this);

	this.doc = doc;
	this.tex = tex;

	if (name && typeof name != 'string')
		throw Error('Assertion failed');

	if (type._type != 'type')
		throw Error('Assertion failed');

	if (!(params instanceof Array)
			|| params.map(e => e instanceof Node).some(e => !e))
		throw Error('Assertion failed');

	if (expr && !(expr instanceof Node))
		throw Error('Assertion failed');

	if (!name && !expr)
		throw Error('Anonymous fun cannot be atomic');

	this.name = name;		// nullable
	this.type = type;
	this.params = params;
	this.expr = expr;		// nullable
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
		(this.name ? 'ƒ ' + this.type.to + ' ' + this.name : '')
			+ `(${this.params.join(', ')}) => (`,
		`\t${this.expr.toIndentedString(indent + 1)}`,
		')'
	].join('\n' + '\t'.repeat(indent));
};

Fun.prototype.toTeXString = function (root) {
	if (!this.name)
		return '\\left('
			+ (
				this.params.length == 1
				? this.params[0].toTeXString()
				: `\\left(${this.params.map(e => e.toTeXString()).join(', ')}\\right)`
			)
			+ `\\mapsto ${this.expr.toTeXString()}\\right)`;

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

	var n = this.escapeTeX(this.name);

	return `${!this.name
			? this.toTeXString()
			: `\\href{#def-${this.name}}{${this.name.length == 1 ? n : `\\mathrm{${n}}`}}`}`
		+ `(${args.join(', ')})`;
};

module.exports = Fun;