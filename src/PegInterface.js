/*
 * PEG.js의 출력과 적절한 클래스 사이를 잇는 인터페이스.
 */

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Rule = require('./nodes/Rule');
var Tee = require('./nodes/Tee');
var Rulecall = require('./nodes/Rulecall');
var Ruleset = require('./nodes/Ruleset');
var Link = require('./nodes/Link');

var PegInterface = {};

function typeObjToString(obj) {
	if (obj._type != 'type')
		throw Error('Assertion failed');

	if (!obj.ftype) return obj.name;
	return '[' + obj.from.map(typeObjToString).join(', ') + ' -> '
			+ typeObjToString(obj.to) + ']';
}

/*
 * Scope.prototype.getType이나 Scope.prototype.hasType 등의 입력 형태로 바꾼다.
 * st						-> 'st'
 * [cls -> st]				-> ['cls', 'st']
 * [(cls, cls) -> st]		-> ['cls', 'cls', 'st']
 * [[cls -> st] -> st]		-> [['cls', 'st'], 'st']
 */
function typeObjToNestedArr(obj) {
	if (obj._type != 'type')
		throw Error('Assertion failed');

	if (!obj.ftype) {
		if (!obj.name)
			throw Error('Assertion failed');

		return obj.name;
	} else {
		if (!obj.from || !obj.to)
			throw Error('Assertion failed');

		return obj.from.map(typeObjToNestedArr).concat(
			[typeObjToNestedArr(obj.to)]
		);
	}
}

function rulenameObjToString(obj) {
	switch (obj.type) {
		case 'link':
			return `${obj.linkName}[${rulenameObjToString(obj.rule)}]`;
		case 'ruleset':
			return `${obj.rulesetName}.${obj.name}`;
		case 'normal':
			return `${obj.name}`;
		default:
			throw Error(`Unknown type ${obj.type}`);
	}
}

function extendTrace(trace, type, name, location) {
	if (!location) throw 'no';
	var ret = trace.slice();
	ret.unshift([type, name, location]);
	return ret;
}

function makeError(message, trace) {
	return new Error(message + '\n\tat ' + trace
		.map(e => `${e[0]} ${e[1]} (code.js:${e[2].start.line}:${e[2].start.column})`).join('\n\tat '));
}

PegInterface.type = function (obj, parentScope, trace) {
	if (obj._type != 'typedef')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'type', obj.name, obj.location);

	var origin = obj.origin ? scope.getType(typeObjToNestedArr(obj.origin)) : null;

	if (origin) {
		return new Type({
			name: obj.name,
			doc: obj.doc,
			origin
		});
	}

	return new Type({
		functional: false,
		name: obj.name,
		doc: obj.doc
	});
}

PegInterface.typevar = function (obj, parentScope, trace) {
	if (obj._type != 'defv')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'typevar', obj.name, obj.location);

	if (!scope.hasType(typeObjToNestedArr(obj.type)))
		throw makeError(`Type ${obj.type} not found`, trace);

	var type = scope.getType(typeObjToNestedArr(obj.type));

	return new Typevar({
		type,
		name: obj.name,
		doc: obj.doc,
		tex: obj.tex
	});
};

PegInterface.fun = function (obj, parentScope, trace) {
	if (obj._type != 'defun' && obj._type != 'funexpr')
		throw Error('Assertion failed');

	var name = null;
	var type = null;
	var params = null;
	var expr = null;
	var scope = parentScope.extend();

	trace = extendTrace(trace, 'fun', obj.name || '<anonymous>', obj.location);

	var doc = obj.doc || null;
	var tex = obj.tex || null;

	switch (obj._type) {
		case 'defun':
			name = obj.name;

			if (!scope.hasType(typeObjToNestedArr(obj.rettype)))
				throw makeError(`Rettype ${typeObjToString(obj.rettype)} not found`, trace);

			var rettype = scope.getType(typeObjToNestedArr(obj.rettype));

			params = obj.params.map(tvo => {
				if (!scope.hasType(typeObjToNestedArr(tvo.type)))
					throw makeError(`Param type ${typeObjToString(tvo.type)} not found`, trace);

				if (scope.hasOwnTypevar(tvo.name))
					throw makeError(`Param name ${tvo.name} already is there`, trace);

				var tv = PegInterface.typevar(tvo, scope, trace);
				return scope.addTypevar(tv);
			});

			type = new Type({
				functional: true,
				from: params.map(typevar => typevar.type),
				to: rettype
			});
			if (obj.expr) {
				switch (obj.expr._type) {
					case 'funcall':
						var funcall = PegInterface.funcall(obj.expr, scope, trace);
						if (!rettype.equals(funcall.type))
							throw makeError(`Return type mismatch: ${rettype}, ${funcall.type}`, trace);
						expr = funcall;
						break;
					case 'funexpr':
						var fun = PegInterface.fun(obj.expr, scope, trace);
						if (!rettype.equals(fun.type))
							throw makeError(`Return type mismatch: ${rettype}, ${fun.type}`, trace);
						expr = fun;
						break;
					case 'var':
						if (!scope.hasTypevar(obj.expr.name))
							throw makeError(`Undefined identifier ${obj.expr.name}`, trace);
						var typevar = scope.getTypevar(obj.expr.name);
						if (!rettype.equals(typevar.type)) {
							throw makeError(`Wrong return type ${rettype}`, trace);
						}
						expr = typevar;
						break;
					default:
						throw makeError(`Unknown type ${obj.expr._type}`, trace);
				}
			}
			break;
		case 'funexpr':
			params = obj.params.map(tvo => {
				if (!scope.hasType(typeObjToNestedArr(tvo.type)))
					throw makeError(`Param type ${typeObjToString(tvo.type)} not found`, trace);

				if (scope.hasOwnTypevar(tvo.name))
					throw makeError(`Param name ${tvo.name} already is there`, trace);

				var tv = PegInterface.typevar(tvo, scope, trace);
				return scope.addTypevar(tv);
			});

			var rettype;

			switch (obj.expr._type) {
				case 'funcall':
					var funcall = PegInterface.funcall(obj.expr, scope, trace);
					rettype = funcall.type;
					expr = funcall;
					break;
				case 'funexpr':
					var fun = PegInterface.fun(obj.expr, scope, trace);
					rettype = fun.type;
					expr = fun;
					break;
				case 'var':
					if (!scope.hasTypevar(obj.expr.name))
						throw makeError(`Undefined identifier ${obj.expr.name}`, trace);
					var typevar = scope.getTypevar(obj.expr.name);
					rettype = typevar.type;
					expr = typevar;
					break;
				default:
					throw makeError(`Unknown type ${obj.expr._type}`, trace);
			}

			type = new Type({
				functional: true,
				from: params.map(typevar => typevar.type),
				to: rettype
			});

			break;
		default:
			throw Error('wut');
	}

	return new Fun({name, type, params, expr, doc, tex});
};

PegInterface.funcall = function (obj, parentScope, trace) {
	if (obj._type != 'funcall')
		throw Error('Assertion failed');

	var fun = null;
	var args = null;
	var scope = parentScope.extend();

	trace = extendTrace(trace, 'funcall', obj.fun.name || '<anonymous>', obj.location);

	switch (obj.fun._type) {
		case 'funcall':
			var funcall = PegInterface.funcall(obj.fun, scope, trace);
			fun = funcall;
			break;
		case 'funexpr':
			fun = PegInterface.fun(obj.fun, scope, trace);
			break;
		case 'var':
			if (!scope.hasTypevar(obj.fun.name))
				throw makeError(`Undefined identifier ${obj.fun.name}`, trace);
			fun = scope.getTypevar(obj.fun.name);
			if (fun.type.isSimple)
				throw makeError(`${fun.name} is not callable`, trace);
			break;
		default:
			throw makeError(`Unknown type ${fun._type}`, trace);
	}

	args = obj.args.map((arg, i) => {
		switch (arg._type) {
			case 'funcall':
				return PegInterface.funcall(arg, scope, trace);
			case 'funexpr':
				return PegInterface.fun(arg, scope, trace);
			case 'var':
				if (!scope.hasTypevar(arg.name))
					throw makeError(`Undefined identifier ${arg.name}`, trace);
				return scope.getTypevar(arg.name);
			default:
				throw makeError(`Unknown type ${obj.expr._type}`, trace);
		}
	});

	var funtype = fun.type.resolve();

	if (args.length != funtype.from.length)
		throw makeError(`Invalid number of arguments: ${obj.args.length}`, trace);

	for (var i = 0; i < args.length; i++)
		if (!args[i].type.equals(funtype.from[i]))
			throw makeError(`Argument type mismatch: ${args[i].type}, ${funtype.from[i]}`, trace);

	return new Funcall({fun, args});
};

PegInterface.rule = function (obj, parentScope, trace) {
	if (obj._type != 'defrule')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'rule', obj.name, obj.location);

	var name = obj.name;
	var params = obj.params.map(tvo => {
		if (!scope.hasType(typeObjToNestedArr(tvo.type)))
			throw makeError(`Param type ${typeObjToString(tvo.type)} not found`, trace);

		if (scope.hasOwnTypevar(tvo.name))
			throw makeError(`Param name ${tvo.name} already is there`, trace);

		var tv = PegInterface.typevar(tvo, scope, trace);
		return scope.addTypevar(tv);
	});

	var foo = obj => {
		switch (obj._type) {
			case 'tee':
				return PegInterface.tee(obj, scope, trace);
			case 'rulecall':
				return PegInterface.rulecall(obj, scope, trace);
			default:
				throw makeError(`Unknown type ${obj._type}`, trace);
		}
	};

	var rules = obj.rules.map(foo);

	return new Rule({name, params, rules, doc: obj.doc});
};

PegInterface.tee = function (obj, parentScope, trace) {
	if (obj._type != 'tee')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'tee', '<anonymous>', obj.location);

	var foo = obj => {
		switch (obj._type) {
			case 'funcall':
				var funcall = PegInterface.funcall(obj, scope, trace);
				if (!scope.root.getType('st').equals(funcall.type))
					throw makeError(`Return type is not st: ${funcall.type}`, trace);
				return funcall;
			case 'funexpr':
				var fun = PegInterface.fun(obj, scope, trace);
				if (!scope.root.getType('st').equals(fun.type))
					throw makeError(`Return type is not st: ${fun.type}`, trace);
				return fun;
			case 'var':
				if (!scope.hasTypevar(obj.name))
					throw makeError(`Undefined identifier ${obj.name}`, trace);
				var typevar = scope.getTypevar(obj.name);
				if (!scope.root.getType('st').equals(typevar.type)) {
					throw makeError(`Return type is not st: ${typevar.type}`, trace);
				}
				return typevar;
			default:
				throw makeError(`Unknown type ${obj._type}`, trace);
		}
	};

	var left = obj.left.map(foo);
	var right = foo(obj.right);

	return new Tee({left, right});
};

PegInterface.rulecall = function (obj, parentScope, trace) {
	if (obj._type != 'rulecall')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'rulecall', rulenameObjToString(obj.rule), obj.location);

	var rule = (function getRule(obj) {
		switch (obj.type) {
			case 'link':
				if (!scope.hasLink(obj.linkName))
					throw makeError(`Link ${obj.linkName} is not defined`, trace);

				var link = scope.getLink(obj.linkName);

				var rule_ = getRule(obj.rule);

				if (!link.native)
					throw Error('Behavior undefined for non-native links');

				var rule = link.native.get([rule_], scope);

				if (!rule)
					throw makeError(`Rule ${rulenameObjToString(obj)} not found`, trace);

				return rule;
			case 'ruleset':
				if (!scope.hasRuleset(obj.rulesetName))
					throw makeError(`Ruleset ${obj.rulesetName} is not defined`, trace);

				var ruleset = scope.getRuleset(obj.rulesetName);

				if (!ruleset.native)
					throw Error('Behavior undefined for non-native rulesets');

				var rule = ruleset.native.get(obj.name, scope);

				if (!rule)
					throw makeError(`Rule ${rulenameObjToString(obj)} not found`, trace);
				
				return rule;
			case 'normal':
				if (!scope.hasRule(obj.name))
					throw makeError(`Rule ${obj.name} is not defined`, trace);

				return scope.getRule(obj.name);
			default:
				throw makeError(`Unknown type ${obj.type}`, trace);
		}
	})(obj.rule);

	var args = obj.args.map((function foo(obj) {
		switch (obj._type) {
			case 'funcall':
				var funcall = PegInterface.funcall(obj, scope, trace);
				return funcall;
			case 'funexpr':
				var fun = PegInterface.fun(obj, scope, trace);
				return fun;
			case 'var':
				if (!scope.hasTypevar(obj.name))
					throw makeError(`Undefined identifier ${obj.name}`, trace);
				var typevar = scope.getTypevar(obj.name);
				return typevar;
			default:
				throw makeError(`Unknown type ${obj._type}`, trace);
		}
	}));

	if (rule.params.length != args.length)
		throw makeError(`Invalid number of arguments: ${args.length}`, trace);

	for (var i = 0; i < args.length; i++)
		if (!args[i].type.equals(rule.params[i].type))
			throw makeError(`Argument type mismatch: ${args[i].type}, ${rule.params[i].type}`, trace);

	return new Rulecall({
		rule,
		args
	});
};

PegInterface.ruleset = function (obj, parentScope, trace, nativeMap) {
	if (obj._type != 'defruleset')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'ruleset', obj.name, obj.location);

	var name = obj.name;

	if (!obj.native)
		throw makeError('Assertion failed', trace);

	if (!nativeMap.ruleset[name])
		throw makeError(`Native code for native ruleset ${name} not found`, trace);

	var native = nativeMap.ruleset[name];

	return new Ruleset({name, native, doc: obj.doc});
};

PegInterface.link = function (obj, parentScope, trace, nativeMap) {
	if (obj._type != 'deflink')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'link', obj.name, obj.location);

	var name = obj.name;

	if (!obj.native)
		throw makeError('Assertion failed', trace);

	if (!nativeMap.link[name])
		throw makeError(`Native code for native link ${name} not found`, trace);

	var native = nativeMap.link[name];

	return new Link({name, native, doc: obj.doc});
};

module.exports = PegInterface;