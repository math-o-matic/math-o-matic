var Node = require('./Node');
var MetaType = require('./MetaType');
var Tee = require('./Tee');

var ExpressionResolver = require('../ExpressionResolver');

function Rule({axiomatic, /* nullable */ name, params, expr, doc}) {
	Node.call(this);

	this.doc = doc;

	if (name !== null && typeof name != 'string')
		throw Error('Assertion failed');

	if (!(params instanceof Array)
			|| params.map(e => e._type == 'typevar').some(e => !e))
		throw Error('Assertion failed');

	if (!(expr.type._type == 'metatype'
			&& expr.type.order == 1
			&& expr.type.isSimple)) {
		throw Error('Expression should be a simple first-order type');
	}
	
	this.axiomatic = axiomatic;
	this.name = name;
	this.params = params;
	this.expr = expr;
	this.type = new MetaType({
		functional: true,
		from: params.map(typevar => typevar.type),
		to: expr.type
	});

	this.expanded = ExpressionResolver.expand1Funcalls(expr);
}

Rule.prototype = Object.create(Node.prototype);
Rule.prototype.constructor = Rule;
Rule.prototype._type = 'rule';

Rule.prototype.toString = function () {
	return this.toIndentedString(0);
};

Rule.prototype.toIndentedString = function (indent) {
	return [
		`R ${this.name || ''}(${this.params.join(', ')}) => {`,
		'\t' + this.expanded.toIndentedString(indent + 1),
		'}'
	].join('\n' + '\t'.repeat(indent));
};

Rule.prototype.toTeXString = function (root) {
	if (!this.name) {
		return '\\left('
			+ (
				this.params.length == 1
				? this.params[0].toTeXString()
				: `\\left(${this.params.map(e => e.toTeXString()).join(', ')}\\right)`
			)
			+ `\\mapsto ${this.expr.toTeXString()}\\right)`;
	}

	if (!root)
		return `\\href{#rule-${this.name}}\\mathsf{${this.escapeTeX(this.name)}}`;

	return `\\href{#rule-${this.name}}{\\mathsf{${this.escapeTeX(this.name)}}}(${this.params.map(e => e.toTeXString()).join(', ')}):`
				+ '\\\\\\quad' + this.expanded.toTeXString();
};

module.exports = Rule;