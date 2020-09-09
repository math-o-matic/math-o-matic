var Node = require('./Node');
var Schemacall = require('./Schemacall');

var ExpressionResolver = require('../ExpressionResolver');

function Reduction({subject, leftargs}, scope, trace) {
	Node.call(this, trace);

	if (!subject.native && subject._type == 'schema') {
		if (subject.params.some(p => !p.guess)) {
			throw this.error('Argument could not be guessed');
		}

		var derefs = subject.params.map(p => this.query(p.guess, ExpressionResolver.expandMeta(subject.expr).left, leftargs));

		subject = new Schemacall({
			schema: subject,
			args: derefs,
		}, scope, trace);
	}

	if (!subject.native
			&& !(subject.type._type == 'metatype' && subject.type.isSimple))
		throw this.error('Subject is not reducible');

	if (!(leftargs instanceof Array)
			|| leftargs.map(e => e instanceof Node).some(e => !e))
		throw this.error('Assertion failed');
	
	this.subject = subject;
	this.leftargs = leftargs;

	if (subject.native) {
		this.reduced = subject.native.get(leftargs);
		this.type = this.reduced.type;
	} else {
		var paramTypes = subject.type.left,
			leftargTypes = leftargs.map(e => e.type);

		if (paramTypes.length != leftargTypes.length)
			throw this.error(`Invalid number of arguments (expected ${paramTypes.length}): ${leftargTypes.length}`);

		for (let i = 0; i < paramTypes.length; i++) {
			if (!paramTypes[i].equals(leftargTypes[i]))
				throw this.error(`Illegal argument type (expected ${paramTypes[i]}): ${leftargTypes[i]}`);
		}

		this.type = subject.type.right;

		var tee = ExpressionResolver.expandMeta(subject);

		if (tee._type != 'tee') {
			throw this.error('Assertion failed');
		}

		for (let i = 0; i < tee.left.length; i++) {
			if (!ExpressionResolver.equalsMeta(tee.left[i], leftargs[i])) {
				throw this.error(`LHS #${i + 1} failed to match:

--- EXPECTED ---
${tee.left[i]}
----------------

--- RECEIVED ---
${leftargs[i]}
----------------`);
			}
		}

		this.reduced = tee.right;
	}
}

Reduction.prototype = Object.create(Node.prototype);
Reduction.prototype.constructor = Reduction;
Reduction.prototype._type = 'reduction';

Reduction.prototype.query = function (guess, left, leftargs) {
	if (guess.length == 0) throw this.error('wut');

	if (!(1 <= guess[0] * 1 && guess[0] * 1 <= leftargs.length))
		throw this.error(`Cannot dereference @${guess}`);

	var lef = left[guess[0] * 1 - 1];
	var ret = leftargs[guess[0] * 1 - 1];

	var that = this;

	return (function recurse(guess, lef, node, ptr) {
		node = ExpressionResolver.expandMetaAndFuncalls(node);
		
		if (guess.length <= ptr) return node;

		if (/[0-9]/.test(guess[ptr])) {
			var n = guess[ptr] * 1;

			while (true) {
				if (!lef.fun || !node.fun) {
					throw that.error(`Cannot dereference @${guess}`);
				}

				if (ExpressionResolver.equals0(lef.fun, node.fun)) {
					break;
				}

				if (!node.fun.expr) {
					throw that.error(`Cannot dereference @${guess}`);
				}

				node = ExpressionResolver.expand0FuncallOnce(node);
			}

			if (!node.args || !(1 <= n && n <= node.args.length))
				throw that.error(`Cannot dereference @${guess}`);

			return recurse(guess, lef.args[n - 1], node.args[n - 1], ptr + 1);
		}

		throw that.error(`Cannot dereference @${guess}`);
	})(guess, lef, ret, 1);
};

Reduction.prototype.toString = function () {
	return this.toIndentedString(0);
};

Reduction.prototype.toIndentedString = function (indent) {
	var leftargs = this.leftargs.map(arg => {
		return arg.toIndentedString(indent + 1);
	});

	if (leftargs.join('').length <= 50) {
		leftargs = this.leftargs.map(arg => {
			return arg.toIndentedString(indent);
		});

		leftargs = leftargs.join(', ');

		return [
			`${this.subject.toIndentedString(indent)}[`,
			leftargs,
			']'
		].join('');
	}
	else {
		leftargs = leftargs.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.subject.toIndentedString(indent)}[`,
			'\t' + leftargs,
			']'
		].join('\n' + '\t'.repeat(indent));
	}
};

Reduction.prototype.toTeXString = function (prec, root) {
	return `${this.subject.toTeXString(false)}[${this.leftargs.map(e => e.toTeXString(this.PREC_COMMA)).join(', ')}]`;
};

module.exports = Reduction;