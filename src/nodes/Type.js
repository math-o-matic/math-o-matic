var Node = require('./Node');

function Type(o) {
	Node.call(this);

	this.doc = o.doc;

	if (o.origin) {
		if (typeof o.name != 'string')
			throw Error('typeof o.name != \'string\'');
		this.name = o.name;

		if (!(o.origin instanceof Type))
			throw Error('!(o.origin instanceof Type)');

		this.isFunctional = o.origin.isFunctional;
		this.isSimple = o.origin.isSimple;
		this.origin = o.origin;
	} else {
		if (typeof o.functional != 'boolean')
			throw Error('typeof o.functional != \'boolean\'');
		this.isFunctional = o.functional;
		this.isSimple = !o.functional;

		if (!o.functional) {
			if (typeof o.name != 'string')
				throw Error('typeof o.name != \'string\'');
			this.name = o.name;
		} else {
			if (o.from.map(f => f instanceof Type).some(e => !e))
				throw Error('o.from.map(f => f instanceof Type).some(e => !e)');
			if (!(o.to instanceof Type))
				throw Error('!(o.to instanceof Type)');

			this.from = o.from;
			this.to = o.to;
		}
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

	return `${this.name ? this.name + ': ' : ''}[${this.resolve().from.join(', ')} -> ${this.resolve().to}]`;
};

Type.prototype.toTeXString = function (root) {
	if (this.isSimple) return `\\href{#type-${this.name}}\\mathsf{${this.name}}`;

	if (!root && this.name) {
		return `\\href{#type-${this.name}}\\mathsf{${this.name}}`;
	}

	return `${this.name ? `\\href{#type-${this.name}}\\mathsf{${this.name}}: ` : ''}`
		+ `\\left[${this.resolve().from.map(e => e.toTeXString()).join(' \\times ')}`
		+ ` \\to ${this.resolve().to.toTeXString()} \\right]`;
};

Type.prototype.resolve = function () {
	return this.origin ? this.origin.resolve() : this;
}

Type.prototype.equals = function (t) {
	if (!(t instanceof Type)) return false;

	if (this.origin) return this.origin.equals(t);
	if (t.origin) return this.equals(t.origin);

	if (this.isSimple != t.isSimple) return false;

	if (this.isSimple) return this === t;

	if (this.from.length != t.from.length) return false;

	for (var i = 0; i < this.from.length; i++)
		if (!this.from[i].equals(t.from[i])) return false;

	return this.to.equals(t.to);
};

module.exports = Type;