'use strict';

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Tee = require('./nodes/Tee');
var Ruleset = require('./nodes/Ruleset');
var Schema = require('./nodes/Schema');
var Schemacall = require('./nodes/Schemacall');

function Scope(parent) {
	this.typedefMap = {};
	this.defMap = {};
	this.schemaMap = {};
	this.rulesetMap = {};

	this.Type = Type;
	this.Typevar = Typevar;
	this.Fun = Fun;
	this.Funcall = Funcall;
	this.Tee = Tee;
	this.Ruleset = Ruleset;
	this.Schema = Schema;
	this.Schemacall = Schemacall;

	this.parent = parent;
	this.root = parent ? parent.root : this;

	this.baseType = parent ? parent.baseType : null;
}

Scope.prototype.extend = function () {
	return new Scope(this);
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
		throw Error('Gimme an array/string');

	if (name.length < 2)
		throw Error('Illegal array length');

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
		throw Error('Gimme an array/string');

	if (name.length < 2)
		throw Error('Illegal array length');

	return name.map(e => {
		return this.hasType(e);
	}).every(e => e);
};

Scope.prototype.addType = function (type) {
	if (!(type instanceof Type))
		throw Error('Illegal argument type');

	if (!type.name)
		throw Error('Something\'s wrong');

	if (this.hasOwnType(type.name))
		throw Error(`Type with name ${type.name} already is there`);

	if (type.isBaseType) {
		if (this.baseType) {
			throw Error('A base type already exists');
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
			throw Error(`Type with name ${name} not found`);

		return this.typedefMap[name] ||
			(!!this.parent && this.parent.getType(name));
	}

	if (!(name instanceof Array))
		throw Error('Gimme an array/string');

	if (name.length < 2)
		throw Error('Illegal array length');

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
		throw Error('Illegal argument type');

	if (this.hasOwnTypevar(typevar.name))
		throw Error(`Def with name ${typevar.name} already is there`);

	return this.defMap[typevar.name] = typevar;
};

Scope.prototype.addFun = function (fun) {
	if (!(fun instanceof Fun))
		throw Error('Illegal argument type');

	if (!fun.name)
		throw Error('Cannot add anonymous fun to scope');

	if (this.hasOwnTypevar(fun.name))
		throw Error(`Def with name ${fun.name} already is there`);

	return this.defMap[fun.name] = fun;
};

Scope.prototype.getTypevar = function (name) {
	if (!this.hasTypevar(name))
		throw Error(`Def with name ${name} not found`);

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
		throw Error('Illegal argument type');

	if (this.hasOwnRuleset(ruleset.name))
		throw Error(`Ruleset with name ${ruleset.name} already is there`);

	return this.rulesetMap[ruleset.name] = ruleset;
};

Scope.prototype.getRuleset = function (name) {
	if (!this.hasRuleset(name))
		throw Error(`Ruleset with name ${name} not found`);

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
		throw Error('Illegal argument type');

	if (this.hasOwnSchema(schema.name))
		throw Error(`Schema with name ${schema.name} already is there`);

	return this.schemaMap[schema.name] = schema;
};

Scope.prototype.getSchema = function (name) {
	if (!this.hasSchema(name))
		throw Error(`Schema with name ${name} not found`);

	return this.schemaMap[name] || this.defMap[name] ||
		(!!this.parent && this.parent.getSchema(name));
};

module.exports = Scope;