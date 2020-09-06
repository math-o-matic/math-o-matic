var Node = require('./Node');

function Typevar({type, name, doc, tex}, scope, trace) {
	Node.call(this, trace);

	this.doc = doc;
	this.tex = tex;

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
	if (this.tex) {
		return this.makeTeX('def-' + this.name, [], prec);
	}

	if (this.name.length == 1) {
		return `\\href{#id-${this._id}}{${this.escapeTeX(this.name)}}`;
	}

	return `\\href{#id-${this._id}}{\\mathrm{${this.escapeTeX(this.name)}}}`;
};

module.exports = Typevar;