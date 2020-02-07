var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Rule = require('./nodes/Rule');
var Yield = require('./nodes/Yield');
var Rulecall = require('./nodes/Rulecall');
var Ruleset = require('./nodes/Ruleset');
var Link = require('./nodes/Link');

var Translator = require('./Translator');

var PegInterface = require('./PegInterface');

function Scope(parent) {
	this.simpleTypeMap = {};
	this.defMap = {};
	this.ruleMap = {};
	this.rulesetMap = {};
	this.linkMap = {};

	this.Type = Type;
	this.Typevar = Typevar;
	this.Fun = Fun;
	this.Funcall = Funcall;
	this.Rule = Rule;
	this.Yield = Yield;
	this.Rulecall = Rulecall;
	this.Ruleset = Ruleset;
	this.Link = Link;

	this.Translator = Translator;

	this.parent = parent;
	this.root = parent ? parent.root : this;
}

Scope.prototype.extend = function () {
	return new Scope(this);
};

Scope.prototype.hasOwnTypeByName = function (name) {
	return !!this.simpleTypeMap[name];
};

Scope.prototype.hasOwnType = function (typeobj) {
	if (!typeobj.ftype) return this.hasOwnTypeByName(typeobj.name);
	return typeobj.from.map(e => this.hasOwnType(e)).every(e => e)
			&& this.hasOwnType(typeobj.to);
};

Scope.prototype.hasTypeByName = function (name) {
	return this.hasOwnTypeByName(name)
		|| (!!this.parent && this.parent.hasTypeByName(name));
};

Scope.prototype.hasType = function (typeobj) {
	if (!typeobj.ftype) return this.hasTypeByName(typeobj.name);
	return typeobj.from.map(e => this.hasType(e)).every(e => e)
			&& this.hasType(typeobj.to);
};

Scope.prototype.addType = function (obj) {
	var type = PegInterface.type(obj, this, []);

	if (this.hasOwnTypeByName(type.name))
		throw Error(`Type with name ${type.name} already is there`);

	return this.simpleTypeMap[type.name] = type;
};

Scope.prototype.getType = function (typeobj) {
	if (!typeobj.ftype) return this.getTypeByName(typeobj.name);
	return new Type({
		functional: true,
		from: typeobj.from.map(e => this.getType(e)),
		to: this.getType(typeobj.to)
	});
};

Scope.prototype.getTypeByName = function (name) {
	if (!this.hasTypeByName(name))
		throw Error(`Type with name ${name} not found`);

	return this.simpleTypeMap[name] ||
		(!!this.parent && this.parent.getTypeByName(name));
};

Scope.prototype.hasOwnTypevarByName = function (name) {
	return !!this.defMap[name];
};

Scope.prototype.hasTypevarByName = function (name) {
	return this.hasOwnTypevarByName(name) ||
		(!!this.parent && this.parent.hasTypevarByName(name));
};

Scope.prototype.addTypevar = function (obj) {
	var typevar = PegInterface.typevar(obj, this, []);

	if (this.hasOwnTypevarByName(obj.name))
		throw Error(`Def with name ${obj.name} already is there`);

	return this.defMap[obj.name] = typevar;
};

Scope.prototype.getTypevarByName = function (name) {
	if (!this.hasTypevarByName(name))
		throw Error(`Def with name ${name} not found`);

	return this.defMap[name] ||
		(!!this.parent && this.parent.getTypevarByName(name));
};

Scope.prototype.addFun = function (obj) {
	var fun = PegInterface.fun(obj, this, []);

	if (!fun.anonymous && this.hasOwnTypevarByName(fun.name))
		throw Error(`Def with name ${fun.name} already is there`);

	return this.defMap[fun.name] = fun;
};

Scope.prototype.hasOwnRuleByName = function (name) {
	return !!this.ruleMap[name];
};

Scope.prototype.hasRuleByName = function (name) {
	return this.hasOwnRuleByName(name)
		|| (!!this.parent && this.parent.hasRuleByName(name));
};

Scope.prototype.addRule = function (defruleobj) {
	var rule = PegInterface.rule(defruleobj, this, []);

	if (this.hasOwnRuleByName(rule.name))
		throw Error(`Rule with name ${rule.name} already is there`);

	return this.ruleMap[rule.name] = rule;
};

Scope.prototype.getRule = function (name) {
	if (!this.hasRuleByName(name))
		throw Error(`Rule with name ${name} not found`);

	return this.ruleMap[name] ||
		(!!this.parent && this.parent.getRule(name));
};

Scope.prototype.hasOwnRulesetByName = function (name) {
	return !!this.rulesetMap[name];
};

Scope.prototype.hasRulesetByName = function (name) {
	return this.hasOwnRulesetByName(name)
		|| (!!this.parent && this.parent.hasRulesetByName(name));
};

Scope.prototype.addRuleset = function (defrulesetobj, nativeMap) {
	var ruleset = PegInterface.ruleset(defrulesetobj, this, [], nativeMap);

	if (this.hasOwnRulesetByName(ruleset.name))
		throw Error(`Ruleset with name ${ruleset.name} already is there`);

	return this.rulesetMap[ruleset.name] = ruleset;
};

Scope.prototype.getRuleset = function (name) {
	if (!this.hasRulesetByName(name))
		throw Error(`Ruleset with name ${name} not found`);

	return this.rulesetMap[name] ||
		(!!this.parent && this.parent.getRuleset(name));
};

Scope.prototype.hasOwnLinkByName = function (name) {
	return !!this.linkMap[name];
};

Scope.prototype.hasLinkByName = function (name) {
	return this.hasOwnLinkByName(name)
		|| (!!this.parent && this.parent.hasLinkByName(name));
};

Scope.prototype.addLink = function (deflinkobj, nativeMap) {
	var link = PegInterface.link(deflinkobj, this, [], nativeMap);

	if (this.hasOwnLinkByName(link.name))
		throw Error(`Link with name ${link.name} already is there`);

	return this.linkMap[link.name] = link;
};

Scope.prototype.getLink = function (name) {
	if (!this.hasLinkByName(name))
		throw Error(`Link with name ${name} not found`);

	return this.linkMap[name] ||
		(!!this.parent && this.parent.getLink(name));
};

module.exports = Scope;