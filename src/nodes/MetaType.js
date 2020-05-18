var Node = require('./Node');
var Type = require('./Type');

function MetaType(o) {
	Node.call(this);

	if (typeof o.functional != 'boolean')
		throw Error('typeof o.functional != \'boolean\'');
	this.isFunctional = o.functional;
	this.isSimple = !o.functional;

	if (!o.functional) {
		if (typeof o.order != 'number' || !(o.order >= 1))
			throw Error('order must be a positive integer');

		this.order = o.order;

		if (!(o.left instanceof Array))
			throw Error('left should be an array');

		if (o.order == 1) {
			if ([...o.left, o.right].some(e => !(e instanceof Type))) {
				throw Error('left & right should be Types if order == 1');
			}
		} else {
			if ([...o.left, o.right].some(e => {
				return !(e instanceof MetaType && e.order == o.order - 1);
			})) {
				throw Error('left & right should be MetaTypes of order (order - 1) if order > 1');
			}
		}

		this.left = o.left;
		this.right = o.right;
	} else {
		if (o.from.some(f => !(f instanceof Type)))
			throw Error('o.from.some(f => !(f instanceof Type))');
		if (!(o.to instanceof MetaType))
			throw Error('!(o.to instanceof MetaType)');

		if (o.to.isFunctional)
			throw Error('Functional metatype in functional metatype is not supported');

		this.from = o.from;
		this.to = o.to;
		this.order = o.to.order;
	}
}

MetaType.prototype = Object.create(Node.prototype);
MetaType.prototype.constructor = MetaType;
MetaType.prototype._type = 'metatype';

MetaType.prototype.toString = function () {
	if (this.isSimple) return `[${this.left.join(', ')} |-(${this.order}) ${this.right}]`;

	return `[${this.from.join(', ')} -> ${this.to}]`;
};

MetaType.prototype.equals = function (t) {
	if (!(t instanceof MetaType)) return false;

	if (this.order != t.order) return false;
	if (this.isSimple != t.isSimple) return false;

	if (this.isSimple) {
		if (this.left.length != t.left.length) return false;

		for (var i = 0; i < this.left.length; i++) {
			if (!this.left[i].equals(t.left[i])) return false;
		}

		if (!this.right.equals(t.right)) return false;

		return true;
	}

	if (this.from.length != t.from.length) return false;

	for (var i = 0; i < this.from.length; i++)
		if (!this.from[i].equals(t.from[i])) return false;

	return this.to.equals(t.to);
};

module.exports = MetaType;