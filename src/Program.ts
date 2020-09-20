import Scope from './Scope';

import Type from './nodes/Type';
import Typevar from './nodes/Typevar';
import Fun from './nodes/Fun';
import Funcall from './nodes/Funcall';
import Tee from './nodes/Tee';
import Ruleset from './nodes/Ruleset';
import Schema from './nodes/Schema';
import Schemacall from './nodes/Schemacall';

import PegInterface from './PegInterface';
import ExpressionResolver from './ExpressionResolver';

ExpressionResolver.init({Type, Typevar, Fun, Funcall, Tee, Ruleset, Schema, Schemacall});

export default class Program {
	public scope = new Scope(null);

	public ExpressionResolver = ExpressionResolver;
	
	constructor() {}

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