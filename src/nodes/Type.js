var Node = require('./Node');

function Type(o) {
	Node.call(this);
	
	if (typeof o.functional != 'boolean')
		throw Error('typeof o.functional != \'boolean\'');
	this.isFunctional = o.functional;
	this.isSimple = !o.functional;

	this.doc = o.doc;

	if (!o.functional) {
		if (typeof o.name != 'string')
			throw Error('typeof o.name != \'string\'');
		this.name = o.name;
	} else {
		if (o.name && typeof o.name != 'string')
			throw Error('name should be string, if given');
		if (o.from.map(f => f instanceof Type).some(e => !e))
			throw Error('o.from.map(f => f instanceof Type).some(e => !e)');
		if (!(o.to instanceof Type))
			throw Error('!(o.to instanceof Type)');

		this.from = o.from;
		this.to = o.to;
	}
}

Type.prototype = Object.create(Node.prototype);
Type.prototype.constructor = Type;
Type.prototype._type = 'type';

Type.prototype.toString = function () {
	return this.toIndentedString(0);
};

Type.prototype.toIndentedString = function (indent) {
	if (this.isSimple) return this.name;

	return `${this.name ? this.name + ': ' : ''}[${this.from.join(', ')} -> ${this.to}]`;
};

Type.prototype.toTeXString = function (root) {
	if (this.isSimple) return `\\href{#type-${this.name}}\\mathsf{${this.name}}`;

	if (!root && this.name) {
		return `\\href{#type-${this.name}}\\mathsf{${this.name}}`;
	}

	return `${this.name ? `\\href{#type-${this.name}}\\mathsf{${this.name}}: ` : ''}`
		+ `\\left[${this.from.map(e => e.toTeXString()).join(' \\times ')}`
		+ ` \\to ${this.to.toTeXString()} \\right]`;
};

Type.prototype.equals = function (t) {
	if (!(t instanceof Type)) return false;

	if (this.isSimple != t.isSimple) return false;

	if (this.isSimple) return this === t;

	if (this.from.length != t.from.length) return false;

	for (var i = 0; i < this.from.length; i++)
		if (!this.from[i].equals(t.from[i])) return false;

	return this.to.equals(t.to);
};

module.exports = Type;