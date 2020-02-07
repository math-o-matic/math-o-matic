var Scope = require('./Scope');

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Rule = require('./nodes/Rule');
var Yield = require('./nodes/Yield');
var Rulecall = require('./nodes/Rulecall');
var Ruleset = require('./nodes/Ruleset');

var Translator = require('./Translator');
Translator.init({Type, Typevar, Fun, Funcall, Rule, Yield, Rulecall, Ruleset});

function Program() {
	this.scope = new Scope(null);
}

Program.prototype.feed = function (lines, nativeMap) {
	lines.forEach(line => {
		switch (line._type) {
			case 'typedef':
				this.scope.addType(line);
				break;
			case 'defv':
				this.scope.addTypevar(line.typevar);
				break;
			case 'defun':
				this.scope.addFun(line);
				break;
			case 'defrule':
				this.scope.addRule(line);
				break;
			case 'defruleset':
				this.scope.addRuleset(line, nativeMap);
				break;
			case 'deflink':
				this.scope.addLink(line, nativeMap);
				break;
			default:
				throw Error(`Unknown line type ${line._type}`);
		}
	});
};

module.exports = Program;