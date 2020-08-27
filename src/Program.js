var Scope = require('./Scope');

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Tee = require('./nodes/Tee');
var Ruleset = require('./nodes/Ruleset');
var Schema = require('./nodes/Schema');
var Schemacall = require('./nodes/Schemacall');

var PegInterface = require('./PegInterface');

var ExpressionResolver = require('./ExpressionResolver');
ExpressionResolver.init({Type, Typevar, Fun, Funcall, Tee, Ruleset, Schema, Schemacall});

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
				var typevar = PegInterface.typevar(line, this.scope, []);
				this.scope.addTypevar(typevar);
				break;
			case 'defun':
				var fun = PegInterface.fun(line, this.scope, []);
				this.scope.addFun(fun);
				break;
			case 'defruleset':
				var ruleset = PegInterface.ruleset(line, this.scope, [], nativeMap);
				this.scope.addRuleset(ruleset);
				break;
			case 'defschema':
				var schema = PegInterface.schema(line, this.scope, [], nativeMap);
				this.scope.addSchema(schema);
				break;
			default:
				throw Error(`Unknown line type ${line._type}`);
		}
	});
};

module.exports = Program;