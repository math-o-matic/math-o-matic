var Node = require('./Node');
var MetaType = require('./MetaType');
var Typevar = require('./Typevar');
var Link = require('./Link');

function Linkcall({link, args}) {
	Node.call(this);

	if (!(link instanceof Link))
		throw Error('Assertion failed');

	if (!(args instanceof Array) || args.some(e => e.type.order != 0)) {
		console.error(args);
		throw Error('Assertion failed');
	}
	
	this.link = link;
	this.args = args;

	if (!(link.type._type == 'metatype'
			&& link.type.isFunctional
			&& link.type.order == 2)) {
		throw Error('Link should be a second-order functional type');
	}

	var paramTypes = link.type.from,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw Error('Assertion failed');

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw Error('Assertion failed');
	}

	this.type = link.type.to;
}

Linkcall.prototype = Object.create(Node.prototype);
Linkcall.prototype.constructor = Linkcall;
Linkcall.prototype._type = 'linkcall';

Linkcall.prototype.toString = function () {
	return this.toIndentedString(0);
};

Linkcall.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		args = this.args.map(arg => {
			if (arg instanceof Typevar) return arg.name;
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.link.name}(`,
			args,
			')'
		].join('');
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.link.name}(`,
			'\t' + args,
			')'
		].join('\n' + '\t'.repeat(indent));
	}
};

Linkcall.prototype.toTeXString = function (root) {
	return `\\href{#link-${this.link.name}}{\\textsf{${this.escapeTeX(this.link.name)}}}`
		+ `(${this.args.map(e => e.toTeXString()).join(', ')})`;
};

module.exports = Linkcall;