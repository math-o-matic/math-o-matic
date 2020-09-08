var Node = require('./Node');
var Type = require('./Type');

function MetaType(o) {
	Node.call(this);

	if (typeof o.functional != 'boolean')
		throw this.error('typeof o.functional != \'boolean\'');
	
	this.isFunctional = o.functional;
	this.isSimple = !o.functional;

	if (!o.functional) {
		if (!(o.left instanceof Array))
			throw this.error('left should be an array');

		this.left = o.left;
		this.right = o.right;
	} else {
		if (o.from.some(f => !(f instanceof Type)))
			throw this.error('o.from.some(f => !(f instanceof Type))');
		if (!(o.to instanceof MetaType))
			throw this.error('!(o.to instanceof MetaType)');

		if (o.to.isFunctional)
			throw this.error('Functional metatype in functional metatype is not supported');

		this.from = o.from;
		this.to = o.to;
	}
}

MetaType.prototype = Object.create(Node.prototype);
MetaType.prototype.constructor = MetaType;
MetaType.prototype._type = 'metatype';

MetaType.prototype.toString = function () {
	if (this.isSimple) return `[${this.left.join(', ')} |- ${this.right}]`;

	return `[${this.from.join(', ')} -> ${this.to}]`;
};

MetaType.prototype.equals = function (t) {
	if (!(t instanceof MetaType)) return false;

	if (this.isSimple != t.isSimple) return false;

	if (this.isSimple) {
		if (this.left.length != t.left.length) return false;

		for (let i = 0; i < this.left.length; i++) {
			if (!this.left[i].equals(t.left[i])) return false;
		}

		if (!this.right.equals(t.right)) return false;

		return true;
	}

	if (this.from.length != t.from.length) return false;

	for (let i = 0; i < this.from.length; i++)
		if (!this.from[i].equals(t.from[i])) return false;

	return this.to.equals(t.to);
};

module.exports = MetaType;