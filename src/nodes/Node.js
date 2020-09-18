var ExpressionResolver = require('../ExpressionResolver');

var ctr = 0;

function Node(scope) {
	this._id = ++ctr;
	this.scope = scope || null;

	if (this.scope && this.name) {
		this.scope.name = this.name;
	}
}

Node.prototype.error = function (message) {
	if (this.scope) {
		return this.scope.error(message);
	} else {
		return new Error(message);
	}
};

Node.prototype.escapeTeX = function (s) {
	return s.replace(/&|%|\$|#|_|{|}|~|\^|\\/g, m => ({
		'&': '\\&', '%': '\\%', '$': '\\$',
		'#': '\\#', '_': '\\_', '{': '\\{',
		'}': '\\}',
		'~': '\\textasciitilde',
		'^': '\\textasciicircum',
		'\\': '\\textbackslash'
	})[m]);
};

Node.prototype.parseTeX = function (tex) {
	var precedence = false;

	var code = tex.replace(/^!<prec=([0-9]+)>/, (match, g1) => {
		precedence = g1 * 1;
		return '';
	});

	return {precedence, code};
};

Node.prototype.isProved = function (hyps) {
	hyps = hyps || [];

	if (hyps.some(hyp => ExpressionResolver.equals(hyp, this))) {
		return true;
	}

	return false;
};

Node.prototype.PREC_FUNEXPR = 1000;
Node.prototype.PREC_COMMA = 1000;
Node.prototype.PREC_COLONEQQ = 100000;

/*
 * false corresponds to 0.
 * true corresponds to w * 2.
 */
Node.prototype.normalizePrecedence = function (prec) {
	if (prec === false) return [0, 0];
	if (prec === true) return [2, 0];
	if (typeof prec == 'number') return [0, prec];

	if (!(prec instanceof Array && prec.length == 2)) {
		console.log(prec);
		throw Error('wut');
	}

	return prec;
};

Node.prototype.shouldConsolidate = function (prec) {
	var my = this.normalizePrecedence(this.precedence || false),
		your = this.normalizePrecedence(prec || false);

	if (my[0] == 0 && my[1] == 0) return false;

	return !(my[0] < your[0] || my[0] == your[0] && my[1] < your[1]);
};

Node.prototype.makeTeX = function (id, args, prec) {
	args = args || [];
	prec = prec || false;
	
	var ret = this.tex;

	if (this.shouldConsolidate(prec)) {
		ret = '\\left(' + ret + '\\right)';
	}

	return ret.replace(/#([0-9]+)/g, (match, g1) => {
		return args[g1 * 1 - 1] || `\\texttt{\\textcolor{red}{\\#${g1}}}`;
	}).replace(/<<(.+?)>>/, (match, g1) => {
		return `\\href{#${id}}{${g1}}`;
	});
};

module.exports = Node;