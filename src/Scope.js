'use strict';

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Tee = require('./nodes/Tee');
var Ruleset = require('./nodes/Ruleset');
var Schema = require('./nodes/Schema');
var Schemacall = require('./nodes/Schemacall');

var StackTrace = require('./StackTrace');

function Scope(parent, trace) {
	this.name = null;
	
	this.typedefMap = {};
	this.defMap = {};
	this.schemaMap = {};
	this.rulesetMap = {};

	this.parent = parent;
	this.root = parent ? parent.root : this;

	if (trace && !(trace instanceof StackTrace)) {
		throw Error('Assertion failed');
	}

	this.trace = trace || new StackTrace();

	this.baseType = parent ? parent.baseType : null;
}

Scope.prototype.Type = Type;
Scope.prototype.Typevar = Typevar;
Scope.prototype.Fun = Fun;
Scope.prototype.Funcall = Funcall;
Scope.prototype.Tee = Tee;
Scope.prototype.Ruleset = Ruleset;
Scope.prototype.Schema = Schema;
Scope.prototype.Schemacall = Schemacall;

Scope.prototype.extend = function (type, name, location) {
	return new Scope(this, this.trace.extend(type, name, location));
};

Scope.prototype.error = function (message) {
	return this.trace.error(message);
};

/*
 * Possible input values:
 * 'st'						-> st
 * ['cls', 'st']			-> [cls -> st]
 * ['cls', 'cls', 'st']		-> [(cls, cls) -> st]
 * [['cls', 'st'], 'st']	-> [[cls -> st] -> st]
 */
Scope.prototype.hasOwnType = function (name) {
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
};

/*
 * Possible input values:
 * 'st'						-> st
 * ['cls', 'st']			-> [cls -> st]
 * ['cls', 'cls', 'st']		-> [(cls, cls) -> st]
 * [['cls', 'st'], 'st']	-> [[cls -> st] -> st]
 */
Scope.prototype.hasType = function (name) {
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
};

Scope.prototype.addType = function (type) {
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

		(function broadcast(scope) {
			scope.baseType = type;
			if (scope.parent) broadcast(scope.parent);
		})(this);
	}

	return this.typedefMap[type.name] = type;
};

/*
 * Possible input values:
 * 'st'						-> st
 * ['cls', 'st']			-> [cls -> st]
 * ['cls', 'cls', 'st']		-> [(cls, cls) -> st]
 * [['cls', 'st'], 'st']	-> [[cls -> st] -> st]
 */
Scope.prototype.getType = function (name) {
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
};

Scope.prototype.hasOwnTypevar = function (name) {
	return !!this.defMap[name];
};

Scope.prototype.hasTypevar = function (name) {
	return this.hasOwnTypevar(name) ||
		(!!this.parent && this.parent.hasTypevar(name));
};

Scope.prototype.addTypevar = function (typevar) {
	if (!(typevar instanceof Typevar))
		throw this.error('Illegal argument type');

	if (this.hasOwnTypevar(typevar.name))
		throw this.error(`Definition ${typevar.name} has already been declared`);

	return this.defMap[typevar.name] = typevar;
};

Scope.prototype.addFun = function (fun) {
	if (!(fun instanceof Fun))
		throw this.error('Illegal argument type');

	if (!fun.name)
		throw this.error('Cannot add anonymous fun to scope');

	if (this.hasOwnTypevar(fun.name))
		throw this.error(`Definition ${fun.name} has already been declared`);

	return this.defMap[fun.name] = fun;
};

Scope.prototype.getTypevar = function (name) {
	if (!this.hasTypevar(name))
		throw this.error(`Definition ${name} is not defined`);

	return this.defMap[name] ||
		(!!this.parent && this.parent.getTypevar(name));
};

Scope.prototype.hasOwnRuleset = function (name) {
	return !!this.rulesetMap[name];
};

Scope.prototype.hasRuleset = function (name) {
	return this.hasOwnRuleset(name)
		|| (!!this.parent && this.parent.hasRuleset(name));
};

Scope.prototype.addRuleset = function (ruleset) {
	if (!(ruleset instanceof Ruleset))
		throw this.error('Illegal argument type');

	if (this.hasOwnRuleset(ruleset.name))
		throw this.error(`Ruleset ${ruleset.name} has already been declared`);

	return this.rulesetMap[ruleset.name] = ruleset;
};

Scope.prototype.getRuleset = function (name) {
	if (!this.hasRuleset(name))
		throw this.error(`Ruleset ${name} is not defined`);

	return this.rulesetMap[name] ||
		(!!this.parent && this.parent.getRuleset(name));
};

Scope.prototype.hasOwnSchema = function (name) {
	return !!this.schemaMap[name] || !!this.defMap[name];
};

Scope.prototype.hasSchema = function (name) {
	return this.hasOwnSchema(name)
		|| (!!this.parent && this.parent.hasSchema(name));
};

Scope.prototype.addSchema = function (schema) {
	if (!(schema instanceof Schema))
		throw this.error('Illegal argument type');

	if (this.hasOwnSchema(schema.name))
		throw this.error(`Schema ${schema.name} has already been declared`);

	return this.schemaMap[schema.name] = schema;
};

Scope.prototype.getSchema = function (name) {
	if (!this.hasSchema(name))
		throw this.error(`Schema ${name} is not defined`);

	return this.schemaMap[name] || this.defMap[name] ||
		(!!this.parent && this.parent.getSchema(name));
};

module.exports = Scope;