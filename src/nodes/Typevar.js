var Node = require('./Node');

function Typevar({type, name, doc, tex}) {
	Node.call(this);

	this.doc = doc;
	this.tex = tex;

	if (type._type != 'type')
		throw Error('Assertion failed');

	if (typeof name != 'string')
		throw Error('Assertion failed');

	this.type = type;
	this.name = name;
}

Typevar.prototype = Object.create(Node.prototype);
Typevar.prototype.constructor = Typevar;
Typevar.prototype._type = 'typevar';

Typevar.prototype.toString = function () {
	return this.toIndentedString(0);
};

Typevar.prototype.toIndentedString = function (indent, root) {
	return `${root ? this.type + ' ' : ''}${this.name}<${this._id}>`;
};

Typevar.prototype.toTeXString = function (root) {
	if (this.tex) {
		return this.makeTeX(this.name);
	}

	if (this.name.length == 1) {
		return `\\href{#id-${this._id}}{${this.name}}`;
	}

	return `\\textcolor{#F57C00}{\\mathrm{${this.escapeTeX(this.name)}}}_{\\scriptscriptstyle ${this._id}}`;
};

module.exports = Typevar;