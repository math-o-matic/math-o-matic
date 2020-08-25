/*
 * PEG.js의 출력과 적절한 클래스 사이를 잇는 인터페이스.
 * PEG.js의 출력은 여기에서만 처리해야 한다.
 */

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Rule = require('./nodes/Rule');
var Tee = require('./nodes/Tee');
var Tee2 = require('./nodes/Tee2');
var Rulecall = require('./nodes/Rulecall');
var Ruleset = require('./nodes/Ruleset');
var Link = require('./nodes/Link');
var Linkcall = require('./nodes/Linkcall');
var Reduction2 = require('./nodes/Reduction2');

var ExpressionResolver = require('./ExpressionResolver');

var PI = {};

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
		.map(e => {
			var [type, name, location] = e;
			return `${type} ${name || '<anonymous>'} (code.js:${location.start.line}:${location.start.column})`;
		}).join('\n\tat '));
}

PI.type = function (obj, parentScope, trace) {
	if (obj._type != 'typedef')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'type', obj.name, obj.location);

	var origin = obj.origin ? scope.getType(typeObjToNestedArr(obj.origin)) : null;

	var name = obj.name;
	var doc = obj.doc;
	var base = obj.base;

	if (base && origin) {
		throw makeError(`Base type must be primitive`, trace);
	}

	if (origin) {
		return new Type({
			name,
			doc,
			base,
			origin
		});
	}

	return new Type({
		functional: false,
		name,
		doc,
		base
	});
};

PI.typevar = function (obj, parentScope, trace) {
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

PI.fun = function (obj, parentScope, trace) {
	if (obj._type != 'defun' && obj._type != 'funexpr')
		throw Error('Assertion failed');

	var name = null;
	var type = null;
	var params = null;
	var expr = null;
	var scope = parentScope.extend();

	trace = extendTrace(trace, 'fun', obj.name || false, obj.location);

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

				var tv = PI.typevar(tvo, scope, trace);
				return scope.addTypevar(tv);
			});

			type = new Type({
				functional: true,
				from: params.map(typevar => typevar.type),
				to: rettype
			});

			if (obj.expr) {
				expr = PI.expr0(obj.expr, scope, trace);
				if (!rettype.equals(expr.type))
					throw makeError(`Expression type ${expr.type} failed to match the return type ${rettype} of fun ${name}`);
			}
			break;
		case 'funexpr':
			params = obj.params.map(tvo => {
				if (!scope.hasType(typeObjToNestedArr(tvo.type)))
					throw makeError(`Param type ${typeObjToString(tvo.type)} not found`, trace);

				if (scope.hasOwnTypevar(tvo.name))
					throw makeError(`Param name ${tvo.name} already is there`, trace);

				var tv = PI.typevar(tvo, scope, trace);
				return scope.addTypevar(tv);
			});

			var rettype;

			expr = PI.expr0(obj.expr, scope, trace);
			rettype = expr.type;

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

PI.funcall = function (obj, parentScope, trace) {
	if (obj._type != 'funcall')
		throw Error('Assertion failed');
	var scope = parentScope.extend();

	trace = extendTrace(trace, 'funcall', obj.fun.name || false, obj.location);

	var fun = PI.expr0(obj.fun, scope, trace);

	if (fun.type.isSimple)
		throw makeError(`${fun.name} is not callable`, trace);

	var args = obj.args.map(arg => {
		return PI.expr0(arg, scope, trace);
	});

	var funtype = fun.type.resolve();

	if (args.length != funtype.from.length)
		throw makeError(`Invalid number of arguments: ${obj.args.length}`, trace);

	for (var i = 0; i < args.length; i++)
		if (!args[i].type.equals(funtype.from[i]))
			throw makeError(`Argument type mismatch: ${args[i].type}, ${funtype.from[i]}`, trace);

	return new Funcall({fun, args});
};

PI.expr2 = function (obj, parentScope, trace) {
	if (!['tee2', 'linkcall', 'linkname'].includes(obj._type))
		throw Error('Assertion failed');

	// don't extend scope/trace
	var scope = parentScope;

	switch (obj._type) {
		case 'tee2':
			return PI.tee2(obj, scope, trace);
		case 'linkcall':
			return PI.linkcall(obj, scope, trace);
		case 'linkname':
			return PI.linkname(obj, scope, trace);
		default:
			throw Error('wut');
	}
};

PI.expr1 = function (obj, parentScope, trace) {
	if (!['tee', 'rulecall', 'ruleexpr', 'reduction2', 'rulename'].includes(obj._type))
		throw Error('Assertion failed');

	// don't extend scope/trace
	var scope = parentScope;

	switch (obj._type) {
		case 'tee':
			return PI.tee(obj, scope, trace);
		case 'rulecall':
			return PI.rulecall(obj, scope, trace);
		case 'ruleexpr':
			return PI.rule(obj, scope, trace);
		case 'reduction2':
			return PI.reduction2(obj, scope, trace);
		case 'rulename':
			return PI.rulename(obj, scope, trace);
		default:
			throw Error('wut');
	}
};

PI.expr0 = function (obj, parentScope, trace) {
	if (!['funcall', 'funexpr', 'var'].includes(obj._type))
		throw Error('Assertion failed');

	// don't extend scope/trace
	var scope = parentScope;

	switch (obj._type) {
		case 'funcall':
			return PI.funcall(obj, scope, trace);
		case 'funexpr':
			return PI.fun(obj, scope, trace);
		case 'var':
			if (!scope.hasTypevar(obj.name))
				throw makeError(`Undefined identifier ${obj.name}`, trace);
			return scope.getTypevar(obj.name);
		default:
			throw Error('wut');
	}
};

PI.linkname = function (obj, parentScope, trace) {
	if (obj._type != 'linkname')
		throw Error('Assertion failed');

	// don't extend scope/trace
	var scope = parentScope;

	if (!scope.hasLink(obj.name))
		throw makeError(`Link ${obj.name} is not defined`, trace);

	return scope.getLink(obj.name);
};

PI.rulename = function (obj, parentScope, trace) {
	if (obj._type != 'rulename')
		throw Error('Assertion failed');

	// don't extend scope/trace
	var scope = parentScope;

	switch (obj.type) {
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
};

PI.rule = function (obj, parentScope, trace) {
	if (obj._type != 'defrule' && obj._type != 'ruleexpr')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'rule', obj.name, obj.location);

	var axiomatic = obj.axiomatic;
	var name = obj.name;
	var params = obj.params.map(tvo => {
		if (!scope.hasType(typeObjToNestedArr(tvo.type)))
			throw makeError(`Param type ${typeObjToString(tvo.type)} not found`, trace);

		if (scope.hasOwnTypevar(tvo.name))
			throw makeError(`Param name ${tvo.name} already is there`, trace);

		var tv = PI.typevar(tvo, scope, trace);
		return scope.addTypevar(tv);
	});

	var expr = PI.expr1(obj.expr, scope, trace);

	if (!(expr.type._type == 'metatype'
			&& expr.type.order == 1
			&& expr.type.isSimple)) {
		throw makeError('Expression should be a simple first-order type', trace);
	}

	return new Rule({axiomatic, name, params, expr, doc: obj.doc});
};

PI.tee2 = function (obj, parentScope, trace) {
	if (obj._type != 'tee2')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'tee2', false, obj.location);

	var left = obj.left.map(e => PI.expr1(e, scope, trace));
	var right = PI.expr1(obj.right, scope, trace);

	return new Tee2({left, right});
};

PI.tee = function (obj, parentScope, trace) {
	if (obj._type != 'tee')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'tee', false, obj.location);

	if (!scope.baseType)
		throw makeError('Base type is not defined', trace);

	var base = scope.baseType;

	var foo = obj => {
		var ret = PI.expr0(obj, scope, trace);

		if (!base.equals(ret.type)
				&& !(ret.type.isFunctional && base.equals(ret.type.resolve().to))) {
			throw makeError(`Type failed to match the base type: ${ret.type}`, trace);
		}
			

		return ret;
	};

	var left = obj.left.map(foo);
	var right = foo(obj.right);

	return new Tee({left, right});
};

PI.linkcall = function (obj, parentScope, trace) {
	if (obj._type != 'linkcall')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'linkcall', false, obj.location);

	var link = PI.expr2(obj.link, scope, trace);

	if (!(link.type._type == 'metatype'
			&& link.type.isFunctional
			&& link.type.order == 2)) {
		throw makeError('Link should be a second-order functional type', trace);
	}

	var args = obj.args.map(obj => {
		return PI.expr0(obj, scope, trace);
	});

	var paramTypes = link.type.from,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw makeError(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`, trace);

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw makeError(`Illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`, trace);
	}

	return new Linkcall({
		link,
		args
	});
};

PI.rulecall = function (obj, parentScope, trace) {
	if (obj._type != 'rulecall')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'rulecall', false, obj.location);

	var rule = PI.expr1(obj.rule, scope, trace);

	if (rule.type.isSimple)
		throw makeError('Rule is not callable', trace);

	var args = obj.args.map(obj => {
		return PI.expr0(obj, scope, trace);
	});

	var argTypes = rule.type.from;

	if (argTypes.length != args.length)
		throw makeError(`Invalid number of arguments (expected ${argTypes.length}): ${args.length}`, trace);

	for (var i = 0; i < args.length; i++)
		if (!args[i].type.equals(argTypes[i]))
			throw makeError(`Illegal argument type (expected ${argTypes[i]}): ${args[i].type}`, trace);

	return new Rulecall({
		rule,
		args
	});
};

PI.ruleset = function (obj, parentScope, trace, nativeMap) {
	if (obj._type != 'defruleset')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'ruleset', obj.name, obj.location);

	var axiomatic = obj.axiomatic;
	var name = obj.name;

	if (!obj.native)
		throw makeError('Assertion failed', trace);

	if (!nativeMap.ruleset[name])
		throw makeError(`Native code for native ruleset ${name} not found`, trace);

	var native = nativeMap.ruleset[name];

	return new Ruleset({axiomatic, name, native, doc: obj.doc});
};

PI.link = function (obj, parentScope, trace, nativeMap) {
	if (obj._type != 'deflink')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'link', obj.name, obj.location);

	var axiomatic = obj.axiomatic;
	var name = obj.name;

	if (obj.native) {
		if (!nativeMap.link[name])
			throw makeError(`Native code for native link ${name} not found`, trace);

		var native = {
			get: args => nativeMap.link[name].get(args, scope, ExpressionResolver)
		};

		return new Link({axiomatic, name, native, doc: obj.doc});
	} else {
		var params = obj.params.map(tvo => {
			if (!scope.hasType(typeObjToNestedArr(tvo.type)))
				throw makeError(`Param type ${typeObjToString(tvo.type)} not found`, trace);

			if (scope.hasOwnTypevar(tvo.name))
				throw makeError(`Param name ${tvo.name} already is there`, trace);

			var tv = PI.typevar(tvo, scope, trace);
			return scope.addTypevar(tv);
		});

		var expr = PI.expr2(obj.expr, scope, trace);

		if (!(expr.type._type == 'metatype'
				&& expr.type.order == 2
				&& expr.type.isSimple)) {
			throw makeError('Link expression should be a simple second-order type', trace);
		}

		return new Link({axiomatic, name, params, expr, doc: obj.doc});
	}
};

PI.reduction2 = function (obj, parentScope, trace) {
	if (obj._type != 'reduction2')
		throw Error('Assertion failed');

	var scope = parentScope.extend();

	trace = extendTrace(trace, 'reduction2', obj.expr2.name || false, obj.location);

	var expr2 = PI.expr2(obj.expr2, scope, trace);

	var args = obj.args.map(obj => {
		return PI.expr1(obj, scope, trace);
	});

	// Skip type check for native links
	if (expr2._type == 'link' && expr2.native) {
		return new Reduction2({
			expr2,
			args
		});
	}

	if (!(expr2.type._type == 'metatype'
			&& expr2.type.isSimple
			&& expr2.type.order == 2)) {
		throw makeError('expr2 is not reducible', trace);
	}

	var paramTypes = expr2.type.left,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw makeError(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`, trace);

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw makeError(`Illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`, trace);
	}

	return new Reduction2({
		expr2,
		args
	});
};

module.exports = PI;