var Scope = require('./Scope');

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Rule = require('./nodes/Rule');
var Tee = require('./nodes/Tee');
var Rulecall = require('./nodes/Rulecall');
var Ruleset = require('./nodes/Ruleset');

var PegInterface = require('./PegInterface');

var ExpressionResolver = require('./ExpressionResolver');
ExpressionResolver.init({Type, Typevar, Fun, Funcall, Rule, Tee, Rulecall, Ruleset});

function Program() {
	this.scope = new Scope(null);
}

Program.prototype.feed = function (lines, nativeMap) {
	lines.forEach(line => {
		switch (line._type) {
			case 'typedef':
				var type = PegInterface.type(line, this.scope, []);
				this.scope.addType(type);
				break;
			case 'defv':
				var typevar = PegInterface.typevar(line.typevar, this.scope, []);
				this.scope.addTypevar(typevar);
				break;
			case 'defun':
				var fun = PegInterface.fun(line, this.scope, []);
				this.scope.addFun(fun);
				break;
			case 'defrule':
				var rule = PegInterface.rule(line, this.scope, []);
				this.scope.addRule(rule);
				break;
			case 'defruleset':
				var ruleset = PegInterface.ruleset(line, this.scope, [], nativeMap);
				this.scope.addRuleset(ruleset);
				break;
			case 'deflink':
				var link = PegInterface.link(line, this.scope, [], nativeMap);
				this.scope.addLink(link);
				break;
			default:
				throw Error(`Unknown line type ${line._type}`);
		}
	});
};

module.exports = Program;