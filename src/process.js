var Scope = require('./Scope');

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Rule = require('./nodes/Rule');
var Yield = require('./nodes/Yield');
var Rulecall = require('./nodes/Rulecall');
var Link = require('./nodes/Link');

var Translator = require('./Translator');
Translator.init({Type, Typevar, Fun, Funcall, Rule, Yield, Rulecall, Link});

function Program(start) {
	this.scope = new Scope(null);

	start.forEach(line => {
		switch (line._type) {
			case 'typedef':
				this.scope.addType(line.type);
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
			case 'deflink':
				this.scope.addLink(line);
				break;
			default:
				throw Error(`Unknown line type ${line._type}`);
		}
	});
}

function process(start) {
	var program = new Program(start);
	return program;
}

module.exports = process;