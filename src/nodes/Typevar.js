var Node = require('./Node');
var Type = require('./Type');

function Typevar(type, name) {
	this._type = 'typevar';
	
	if (!(type instanceof Type))
		throw Error(`!(type instanceof Type)`);

	this.type = type;
	this.name = name;
}

Typevar.prototype = Object.create(Node.prototype);
Typevar.prototype.constructor = Typevar;

Typevar.prototype.toString = function () {
	return this.toIndentedString(0);
}

Typevar.prototype.toIndentedString = function () {
	return `${this.type} ${this.name}`;
}

Typevar.prototype.toTeXString = function (root) {
	if (this.name.length == 1) {
		return `${this.name}`;
	}

	return `\\href{#typevar-${this.name}}\\mathrm{${this.escapeTeX(this.name)}}`;
}

module.exports = Typevar;