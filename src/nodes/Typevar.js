var Node = require('./Node');

function Typevar({type, isParam, guess, name, doc, tex}, scope, trace) {
	Node.call(this, trace);

	this.doc = doc;
	this.tex = tex;

	this.isParam = !!isParam;
	this.guess = guess || null;

	if (type._type != 'type')
		throw this.error('Assertion failed');

	if (typeof name != 'string')
		throw this.error('Assertion failed');

	this.type = type;
	this.name = name;
}

Typevar.prototype = Object.create(Node.prototype);
Typevar.prototype.constructor = Typevar;
Typevar.prototype._type = 'typevar';

Typevar.prototype.toString = function () {
	return this.toIndentedString(0);
};

// pr f
Typevar.prototype.toSimpleString = function () {
	return this.type.toSimpleString() + ' ' + this.name;
};

Typevar.prototype.toIndentedString = function (indent, root) {
	return `${root ? this.type + ' ' : ''}${this.name}<${this._id}>`;
};

Typevar.prototype.toTeXString = function (prec, root) {
	var id = this.isParam ? `id-${this._id}` : `def-${this.name}`;

	var tex = this.tex
		|| (
			this.name.length == 1
				? this.escapeTeX(this.name)
				: `\\mathrm{${this.escapeTeX(this.name)}}`
		);
	
	return `\\href{#${id}}{${tex}}`;
};

module.exports = Typevar;