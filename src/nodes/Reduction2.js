var Node = require('./Node');
var MetaType = require('./MetaType');
var Typevar = require('./Typevar');
var Link = require('./Link');

function Reduction2({expr2, args}) {
	Node.call(this);

	if (!(expr2 instanceof Node))
		throw Error('Assertion failed');

	if (!(args instanceof Array)
			|| args.map(e => e instanceof Node).some(e => !e))
		throw Error('Assertion failed');
	
	this.expr2 = expr2;
	this.args = args;

	if (!(expr2.type._type == 'metatype'
			&& expr2.type.isSimple
			&& expr2.type.order == 2)) {
		throw Error('Expression should be a second-order simple type');
	}

	var paramTypes = expr2.type.left,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw Error('Assertion failed');

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw Error('Assertion failed');
	}

	this.type = expr2.type.right;
}

Reduction2.prototype = Object.create(Node.prototype);
Reduction2.prototype.constructor = Reduction2;
Reduction2.prototype._type = 'reduction2';

Reduction2.prototype.toString = function () {
	return this.toIndentedString(0);
};

Reduction2.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		args = this.args.map(arg => {
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.expr2}[`,
			args,
			']'
		].join('');
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.expr2}[`,
			'\t' + args,
			']'
		].join('\n' + '\t'.repeat(indent));
	}
};

Reduction2.prototype.toTeXString = function (root) {
	return `${this.expr2.toTeXString()}[${this.args.map(e => e.toTeXString()).join(', ')}]`;
};

module.exports = Reduction2;