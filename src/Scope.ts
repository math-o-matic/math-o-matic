import Type from './nodes/Type';
import Typevar from './nodes/Typevar';
import Tee from './nodes/Tee';
import Ruleset from './nodes/Ruleset';
import Schema from './nodes/Schema';
import Schemacall from './nodes/Schemacall';

import StackTrace from './StackTrace';

export default class Scope {
	public readonly typedefMap = {};
	public readonly defMap = {};
	public readonly schemaMap = {};
	public readonly rulesetMap = {};

	public readonly parent: Scope;
	public readonly root: Scope;

	public readonly trace: StackTrace;
	public baseType: Type;

	public readonly Type = Type;
	public readonly Typevar = Typevar;
	public readonly Tee = Tee;
	public readonly Ruleset = Ruleset;
	public readonly Schema = Schema;
	public readonly Schemacall = Schemacall;

	constructor (parent: Scope, trace?: StackTrace) {
		this.parent = parent;
		this.root = parent ? parent.root : this;

		if (trace && !(trace instanceof StackTrace)) {
			throw Error('Assertion failed');
		}

		this.trace = trace || new StackTrace();

		this.baseType = parent ? parent.baseType : null;
	}

	public extend(type, name, location) {
		return new Scope(this, this.trace.extend(type, name, location));
	}

	public error(message: string) {
		return this.trace.error(message);
	}

	/*
	 * Possible input values:
	 * 'st'						-> st
	 * ['cls', 'st']			-> [cls -> st]
	 * ['cls', 'cls', 'st']		-> [(cls, cls) -> st]
	 * [['cls', 'st'], 'st']	-> [[cls -> st] -> st]
	 */
	public hasOwnType(name) {
		if (typeof name == 'string') {
			return !!this.typedefMap[name];
		}

		if (!(name instanceof Array))
			throw this.error('Argument is malformed');

		if (name.length < 2)
			throw this.error('Illegal array length');

		return name.map(e => {
			return this.hasOwnType(e);
		}).every(e => e);
	}

	/*
	 * Possible input values:
	 * 'st'						-> st
	 * ['cls', 'st']			-> [cls -> st]
	 * ['cls', 'cls', 'st']		-> [(cls, cls) -> st]
	 * [['cls', 'st'], 'st']	-> [[cls -> st] -> st]
	 */
	public hasType(name) {
		if (typeof name == 'string') {
			return this.hasOwnType(name)
				|| (!!this.parent && this.parent.hasType(name));
		}

		if (!(name instanceof Array))
			throw this.error('Argument is malformed');

		if (name.length < 2)
			throw this.error('Illegal array length');

		return name.map(e => {
			return this.hasType(e);
		}).every(e => e);
	}

	public addType(type: Type) {
		if (!(type instanceof Type))
			throw this.error('Illegal argument type');

		if (!type.name)
			throw this.error('Something\'s wrong');

		if (this.hasOwnType(type.name))
			throw this.error(`Type ${type.name} has already been declared`);

		if (type.isBaseType) {
			if (this.baseType) {
				throw this.error('A base type already exists');
			}

			(function broadcast(scope: Scope) {
				scope.baseType = type;
				if (scope.parent) broadcast(scope.parent);
			})(this);
		}

		return this.typedefMap[type.name] = type;
	}

	/*
	 * Possible input values:
	 * 'st'						-> st
	 * ['cls', 'st']			-> [cls -> st]
	 * ['cls', 'cls', 'st']		-> [(cls, cls) -> st]
	 * [['cls', 'st'], 'st']	-> [[cls -> st] -> st]
	 */
	public getType(name) {
		if (typeof name == 'string') {
			if (!this.hasType(name))
				throw this.error(`Type ${name} is not defined`);

			return this.typedefMap[name] ||
				(!!this.parent && this.parent.getType(name));
		}

		if (!(name instanceof Array))
			throw this.error('Argument is malformed');

		if (name.length < 2)
			throw this.error('Illegal array length');

		var from = name.slice(0, name.length - 1).map(e => {
			return this.getType(e);
		});

		var to = this.getType(name[name.length - 1]);

		return new Type({
			functional: true,
			from,
			to
		});
	}

	public hasOwnTypevar(name) {
		return !!this.defMap[name];
	}

	public hasTypevar(name) {
		return this.hasOwnTypevar(name) ||
			(!!this.parent && this.parent.hasTypevar(name));
	}

	public addTypevar(typevar) {
		if (!(typevar instanceof Typevar))
			throw this.error('Illegal argument type');

		if (this.hasOwnTypevar(typevar.name))
			throw this.error(`Definition ${typevar.name} has already been declared`);

		return this.defMap[typevar.name] = typevar;
	}

	public addFun(fun) {
		if (!(fun instanceof Schema))
			throw this.error('Illegal argument type');

		if (!fun.name)
			throw this.error('Cannot add anonymous fun to scope');

		if (this.hasOwnTypevar(fun.name))
			throw this.error(`Definition ${fun.name} has already been declared`);

		return this.defMap[fun.name] = fun;
	}

	public getTypevar(name) {
		if (!this.hasTypevar(name))
			throw this.error(`Definition ${name} is not defined`);

		return this.defMap[name] ||
			(!!this.parent && this.parent.getTypevar(name));
	}

	public hasOwnRuleset(name) {
		return !!this.rulesetMap[name];
	}

	public hasRuleset(name) {
		return this.hasOwnRuleset(name)
			|| (!!this.parent && this.parent.hasRuleset(name));
	}

	public addRuleset(ruleset) {
		if (!(ruleset instanceof Ruleset))
			throw this.error('Illegal argument type');

		if (this.hasOwnRuleset(ruleset.name))
			throw this.error(`Ruleset ${ruleset.name} has already been declared`);

		return this.rulesetMap[ruleset.name] = ruleset;
	}

	public getRuleset(name) {
		if (!this.hasRuleset(name))
			throw this.error(`Ruleset ${name} is not defined`);

		return this.rulesetMap[name] ||
			(!!this.parent && this.parent.getRuleset(name));
	}

	public hasOwnSchema(name) {
		return !!this.schemaMap[name] || !!this.defMap[name];
	}

	public hasSchema(name) {
		return this.hasOwnSchema(name)
			|| (!!this.parent && this.parent.hasSchema(name));
	}

	public addSchema(schema) {
		if (!(schema instanceof Schema))
			throw this.error('Illegal argument type');

		if (this.hasOwnSchema(schema.name))
			throw this.error(`Schema ${schema.name} has already been declared`);

		return this.schemaMap[schema.name] = schema;
	}

	public getSchema(name) {
		if (!this.hasSchema(name))
			throw this.error(`Schema ${name} is not defined`);

		return this.schemaMap[name] || this.defMap[name] ||
			(!!this.parent && this.parent.getSchema(name));
	}
}