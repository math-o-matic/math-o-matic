var Node = require('./Node');
var Type = require('./Type');

/*
 * name, expr 중 하나 이상 있어야 하고 type, expr 중
 * 한 개만 있어야 한다.
 */
function Fun({name, type, params, expr, doc, tex}, scope, trace) {
	Node.call(this, trace);

	this.doc = doc;

	if (tex) {
		var {precedence, code} = this.parseTeX(tex);

		this.precedence = precedence;
		this.tex = code;
	} else {
		this.precedence = false;
		this.tex = false;
	}

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

Fun.prototype.toTeXString = function (prec, root) {
	if (!this.name) {
		this.precedence = this.PREC_FUNEXPR;
		return [
			(this.shouldConsolidate(prec) ? '\\left(' : ''),
			(
				this.params.length == 1
				? this.params[0].toTeXString(false)
				: `\\left(${this.params.map(e => e.toTeXString(this.PREC_COMMA)).join(', ')}\\right)`
			),
			`\\mapsto ${this.expr.toTeXString(false)}`,
			(this.shouldConsolidate(prec) ? '\\right)' : '')
		].join('');
	}

	if (!root)
		return `\\href{#def-${this.name}}\\mathrm{${this.escapeTeX(this.name)}}`;

	if (!this.expr)
		return this.funcallToTeXString(this.params, prec);

	return this.funcallToTeXString(this.params, prec)
			+ `\\coloneqq ${this.expr.toTeXString(this.PREC_COLONEQQ)}`;
};

Fun.prototype.funcallToTeXString = function (args, prec) {
	args = args.map(arg => {
		return arg.toTeXString(this.precedence);
	});

	if (this.tex) {
		return this.makeTeX('def-' + this.name, args, prec);
	}

	return `${!this.name
			? this.toTeXString(prec)
			: `\\href{#def-${this.name}}{${this.name.length == 1 ? this.escapeTeX(this.name) : `\\mathrm{${this.escapeTeX(this.name)}}`}}`}`
		+ `(${args.join(', ')})`;
};

module.exports = Fun;