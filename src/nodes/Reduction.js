var Node = require('./Node');

var ExpressionResolver = require('../ExpressionResolver');

function Reduction({subject, args}, scope, trace) {
	Node.call(this, trace);

	if (!(subject instanceof Node))
		throw this.error('Assertion failed');

	if (!(args instanceof Array)
			|| args.map(e => e instanceof Node).some(e => !e))
		throw this.error('Assertion failed');
	
	this.subject = subject;
	this.args = args;

	if (subject.native) {
		this.reduced = subject.native.get(args);
		this.type = this.reduced.type;
	} else {
		var paramTypes = subject.type.left,
			argTypes = args.map(e => e.type);

		if (paramTypes.length != argTypes.length)
			throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

		for (var i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(argTypes[i]))
				throw this.error(`Illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
		}

		this.type = subject.type.right;

		var tee = ExpressionResolver.expandMeta(subject);

		if (tee._type != 'tee') {
			throw this.error('Assertion failed');
		}

		for (var i = 0; i < tee.left.length; i++) {
			if (!ExpressionResolver.equalsMeta(tee.left[i], args[i])) {
				throw this.error('Assertion failed');
			}
		}

		this.reduced = tee.right;
	}
}

Reduction.prototype = Object.create(Node.prototype);
Reduction.prototype.constructor = Reduction;
Reduction.prototype._type = 'reduction';

Reduction.prototype.toString = function () {
	return this.toIndentedString(0);
};

Reduction.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		args = this.args.map(arg => {
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.subject.toIndentedString(indent)}[`,
			args,
			']'
		].join('');
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.subject.toIndentedString(indent)}[`,
			'\t' + args,
			']'
		].join('\n' + '\t'.repeat(indent));
	}
};

Reduction.prototype.toTeXString = function (root) {
	return `${this.subject.toTeXString()}[${this.args.map(e => e.toTeXString()).join(', ')}]`;
};

module.exports = Reduction;