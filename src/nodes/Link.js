var Node = require('./Node');
var MetaType = require('./MetaType');
var Tee = require('./Tee');

var ExpressionResolver = require('../ExpressionResolver');

function Link({name, params, expr, doc}) {
	Node.call(this);

	this.doc = doc;

	if (typeof name != 'string')
		throw Error('Assertion failed');

	if (!(params instanceof Array)
			|| params.map(e => e._type == 'typevar').some(e => !e))
		throw Error('Assertion failed');

	if (!(expr.type._type == 'metatype'
			&& expr.type.order == 2
			&& expr.type.isSimple)) {
		throw Error('Link expression should be a simple second-order type');
	}
	
	this.name = name;
	this.params = params;
	this.expr = expr;
	this.type = new MetaType({
		functional: true,
		from: params.map(typevar => typevar.type),
		to: expr.type
	});
}

Link.prototype = Object.create(Node.prototype);
Link.prototype.constructor = Link;
Link.prototype._type = 'link';

Link.prototype.toString = function () {
	return this.toIndentedString(0);
};

Link.prototype.toIndentedString = function (indent) {
	return [
		`L ${this.name}(${this.params.join(', ')}) =>`,
		'\t\t' + this.expr.toIndentedString(indent + 2)
	].join('\n' + '\t'.repeat(indent));
};

Link.prototype.toTeXString = function (root) {
	return `\\href{#link-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')}):`
		+ '\\\\\\quad' + this.expr.toTeXString();
};

module.exports = Link;