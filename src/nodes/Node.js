var ctr = (() => {
	var i = 1;
	return () => i++;
})();

function Node() {
	this._id = ctr();
}

Node.prototype.escapeTeX = function (s) {
	return s.replace(/_/g, '\\_')
			.replace(/\$/g, '\\$');
}

module.exports = Node;