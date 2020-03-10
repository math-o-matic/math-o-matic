'use strict';

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Rule = require('./nodes/Rule');
var Tee = require('./nodes/Tee');
var Rulecall = require('./nodes/Rulecall');
var Ruleset = require('./nodes/Ruleset');
var Link = require('./nodes/Link');

var ExpressionResolver = require('./ExpressionResolver');

var PegInterface = require('./PegInterface');

function Scope(parent) {
	this.typedefMap = {};
	this.defMap = {};
	this.ruleMap = {};
	this.rulesetMap = {};
	this.linkMap = {};

	this.Type = Type;
	this.Typevar = Typevar;
	this.Fun = Fun;
	this.Funcall = Funcall;
	this.Rule = Rule;
	this.Tee = Tee;
	this.Rulecall = Rulecall;
	this.Ruleset = Ruleset;
	this.Link = Link;

	this.ExpressionResolver = ExpressionResolver;

	this.parent = parent;
	this.root = parent ? parent.root : this;
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
}

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
}

Scope.prototype.addType = function (type) {
	if (!(type instanceof Type))
		throw Error('Illegal argument type');

	if (!type.name)
		throw Error(`Something's wrong`);

	if (this.hasOwnType(type.name))
		throw Error(`Type with name ${type.name} already is there`);

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
}

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

	if (fun.anonymous)
		throw Error(`Cannot add anonymous fun to scope`);

	if (this.hasOwnTypevar(fun.name))
		throw Error(`Def with name ${fun.name} already is there`);

	return this.defMap[fun.name] = fun;
}

Scope.prototype.getTypevar = function (name) {
	if (!this.hasTypevar(name))
		throw Error(`Def with name ${name} not found`);

	return this.defMap[name] ||
		(!!this.parent && this.parent.getTypevar(name));
};

Scope.prototype.hasOwnRule = function (name) {
	return !!this.ruleMap[name];
};

Scope.prototype.hasRule = function (name) {
	return this.hasOwnRule(name)
		|| (!!this.parent && this.parent.hasRule(name));
};

Scope.prototype.addRule = function (rule) {
	if (!(rule instanceof Rule))
		throw Error('Illegal argument type');

	if (this.hasOwnRule(rule.name))
		throw Error(`Rule with name ${rule.name} already is there`);

	return this.ruleMap[rule.name] = rule;
};

Scope.prototype.getRule = function (name) {
	if (!this.hasRule(name))
		throw Error(`Rule with name ${name} not found`);

	return this.ruleMap[name] ||
		(!!this.parent && this.parent.getRule(name));
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

Scope.prototype.hasOwnLink = function (name) {
	return !!this.linkMap[name];
};

Scope.prototype.hasLink = function (name) {
	return this.hasOwnLink(name)
		|| (!!this.parent && this.parent.hasLink(name));
};

Scope.prototype.addLink = function (link) {
	if (!(link instanceof Link))
		throw Error('Illegal argument type');

	if (this.hasOwnLink(link.name))
		throw Error(`Link with name ${link.name} already is there`);

	return this.linkMap[link.name] = link;
};

Scope.prototype.getLink = function (name) {
	if (!this.hasLink(name))
		throw Error(`Link with name ${name} not found`);

	return this.linkMap[name] ||
		(!!this.parent && this.parent.getLink(name));
};

module.exports = Scope;