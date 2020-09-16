'use strict';

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

class Program {
	constructor() {
		this.scope = new Scope(null);
	}

	feed(lines, nativeMap) {
		lines.forEach(line => {
			switch (line._type) {
				case 'typedef':
					var type = PegInterface.type(line, this.scope);

					if (this.scope.hasType(type.name)) {
						throw type.scope.error(`Type ${type.name} has already been declared`);
					}

					this.scope.addType(type);
					break;
				case 'defv':
					var typevar = PegInterface.typevar(line, this.scope);

					if (this.scope.hasTypevar(typevar.name)) {
						throw typevar.scope.error(`Definition ${typevar.name} has already been declared`);
					}

					this.scope.addTypevar(typevar);
					break;
				case 'defun':
					var fun = PegInterface.fun(line, this.scope);

					if (this.scope.hasTypevar(fun.name)) {
						throw fun.scope.error(`Definition ${fun.name} has already been declared`);
					}

					this.scope.addFun(fun);
					break;
				case 'defruleset':
					var ruleset = PegInterface.ruleset(line, this.scope, nativeMap);

					if (this.scope.hasRuleset(ruleset.name)) {
						throw ruleset.scope.error(`Ruleset ${ruleset.name} has already been declared`);
					}

					this.scope.addRuleset(ruleset);
					break;
				case 'defschema':
					var schema = PegInterface.schema(line, this.scope, nativeMap);

					if (this.scope.hasSchema(schema.name)) {
						throw schema.scope.error(`Schema ${schema.name} has already been declared`);
					}

					this.scope.addSchema(schema);
					break;
				default:
					throw Error(`Unknown line type ${line._type}`);
			}
		});
	}

	evaluate(line) {
		switch (line._type) {
			case 'typedef':
			case 'defv':
			case 'defun':
			case 'defruleset':
			case 'defschema':
			case 'tee':
			case 'reduction':
			case 'schemacall':
			case 'var':
			case 'schemaexpr':
				return PegInterface[({
					typedef: 'type',
					defv: 'typevar',
					defun: 'fun',
					defruleset: 'ruleset',
					defschema: 'schema',
					tee: 'tee',
					reduction: 'reduction',
					schemacall: 'schemacall',
					var: 'metavar',
					schemaexpr: 'schemaexpr'
				})[line._type]](line, this.scope);
			default:
				throw Error(`Unknown line type ${line._type}`);
		}
	}
}

Program.prototype.ExpressionResolver = ExpressionResolver;

module.exports = Program;