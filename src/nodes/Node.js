var ctr = 0;

function Node(trace) {
	this._id = ++ctr;
	this.trace = trace || null;
}

Node.prototype.error = function (message) {
	if (this.trace) {
		return this.trace.error(message);
	} else {
		return new Error(message);
	}
}

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

Node.prototype.makeTeX = function (id, args) {
	args = args || [];
	
	var ret = this.tex.replace(/<<(.+?)>>/, (_, s) => {
		return `\\href{#${id}}{${s}}`;
	});

	args.forEach((arg, i) => {
		ret = ret.replace(new RegExp('#' + (i + 1), 'g'), arg);
	});

	return ret;
};

module.exports = Node;