var Node = require('./Node');
var Typevar = require('./Typevar');

var ExpressionResolver = require('../ExpressionResolver');

function Schemacall({schema, args}, scope) {
	Node.call(this, scope);

	if (!schema) {
		throw this.error('Assertion failed');
	}

	if (!(args instanceof Array))
		throw this.error('Assertion failed');
	
	this.schema = schema;
	this.args = args;

	var paramTypes = schema.type.from,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw this.error(`Illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
	}

	this.type = schema.type.to;

	this.expanded = ExpressionResolver.expandMetaAndFuncalls(this);
}

Schemacall.prototype = Object.create(Node.prototype);
Schemacall.prototype.constructor = Schemacall;
Schemacall.prototype._type = 'schemacall';

Schemacall.prototype.isProved = function (hyps) {
	hyps = hyps || [];
	
	return Node.prototype.isProved.call(this, hyps)
		|| this.schema.isProved(hyps);
};

Schemacall.prototype.toString = function () {
	return this.toIndentedString(0);
};

Schemacall.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		args = this.args.map(arg => {
			if (arg instanceof Typevar) return `${arg.name}<${arg._id}>`;
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.schema.name || `(${this.schema})`}(`,
			args,
			')'
		].join('');
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.schema.name || `(${this.schema.toIndentedString(indent)})`}(`,
			'\t' + args,
			')'
		].join('\n' + '\t'.repeat(indent));
	}
};

Schemacall.prototype.toTeXString = function (prec, root) {
	return (
		this.schema.name
			? `\\href{#schema-${this.schema.name}-${this.schema.proved ? 'p' : 'np'}}{\\textsf{${this.escapeTeX(this.schema.name)}}}`
			: this.schema.toTeXString(false)
	) + `(${this.args.map(e => e.toTeXString(this.PREC_COMMA)).join(', ')})`;
};

module.exports = Schemacall;