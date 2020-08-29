/*
 * PEG.js의 출력과 적절한 클래스 사이를 잇는 인터페이스.
 * PEG.js의 출력은 여기에서만 처리해야 한다.
 */

var Type = require('./nodes/Type');
var Typevar = require('./nodes/Typevar');
var Fun = require('./nodes/Fun');
var Funcall = require('./nodes/Funcall');
var Tee = require('./nodes/Tee');
var Ruleset = require('./nodes/Ruleset');
var Schema = require('./nodes/Schema');
var Schemacall = require('./nodes/Schemacall');
var Reduction = require('./nodes/Reduction');

var ExpressionResolver = require('./ExpressionResolver');

var StackTrace = require('./StackTrace');

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

function varObjToString(obj) {
	switch (obj.type) {
		case 'ruleset':
			return `${obj.rulesetName}.${obj.name}`;
		case 'normal':
			return `${obj.name}`;
		default:
			throw Error(`Unknown type ${obj.type}`);
	}
}

PI.type = function (obj, parentScope, trace) {
	if (obj._type != 'typedef')
		throw Error('Assertion failed');

	var scope = parentScope.extend();
	trace = trace.extend('type', obj.name, obj.location);

	var origin = obj.origin ? scope.getType(typeObjToNestedArr(obj.origin)) : null;

	var name = obj.name;
	var doc = obj.doc;
	var base = obj.base;

	if (base && origin) {
		throw trace.error('Base type should not be an alias');
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
	trace = trace.extend('typevar', obj.name, obj.location);

	if (!scope.hasType(typeObjToNestedArr(obj.type)))
		throw trace.error(`Type ${obj.type} not found`);

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

	var scope = parentScope.extend();
	trace = trace.extend('fun', obj.name || null, obj.location);

	var name = obj.name || null;
	var type = null;
	var params = obj.params.map(tvo => {
		if (!scope.hasType(typeObjToNestedArr(tvo.type)))
			throw trace.error(`Param type ${typeObjToString(tvo.type)} not found`);

		if (scope.hasOwnTypevar(tvo.name))
			throw trace.error(`Param name ${tvo.name} already is there`);

		var tv = PI.typevar(tvo, scope, trace);
		return scope.addTypevar(tv);
	});
	var expr = null;
	var doc = obj.doc || null;
	var tex = obj.tex || null;

	switch (obj._type) {
		case 'defun':
			if (!scope.hasType(typeObjToNestedArr(obj.rettype)))
				throw trace.error(`Rettype ${typeObjToString(obj.rettype)} not found`);

			var rettype = scope.getType(typeObjToNestedArr(obj.rettype));

			if (obj.expr) {
				expr = PI.expr0(obj.expr, scope, trace);
				if (!rettype.equals(expr.type))
					throw trace.error(`Expression type ${expr.type} failed to match the return type ${rettype} of fun ${name}`);
			} else {
				type = new Type({
					functional: true,
					from: params.map(typevar => typevar.type),
					to: rettype
				});
			}
			break;
		case 'funexpr':
			expr = PI.expr0(obj.expr, scope, trace);
			type = null;
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
	trace = trace.extend('funcall', obj.fun.name || null, obj.location);

	var fun = PI.expr0(obj.fun, scope, trace);

	if (fun.type.isSimple)
		throw trace.error(`${fun.name} is not callable`);

	var args = obj.args.map(arg => {
		return PI.expr0(arg, scope, trace);
	});

	var funtype = fun.type.resolve();

	if (args.length != funtype.from.length)
		throw trace.error(`Invalid number of arguments: ${obj.args.length}`);

	for (var i = 0; i < args.length; i++)
		if (!args[i].type.equals(funtype.from[i]))
			throw trace.error(`Argument type mismatch: ${args[i].type}, ${funtype.from[i]}`);

	return new Funcall({fun, args});
};

PI.metaexpr = function (obj, parentScope, trace) {
	if (!['tee', 'reduction', 'schemacall', 'schemaexpr', 'var'].includes(obj._type))
		throw Error('Assertion failed');

	// don't extend scope/trace
	var scope = parentScope;

	switch (obj._type) {
		case 'tee':
			return PI.tee(obj, scope, trace);
		case 'reduction':
			return PI.reduction(obj, scope, trace);
		case 'schemacall':
			return PI.schemacall(obj, scope, trace);
		case 'schemaexpr':
			return PI.schema(obj, scope, trace);
		case 'var':
			return PI.metavar(obj, scope, trace);
		default:
			throw Error('wut');
	}
};

PI.expr0 = function (obj, parentScope, trace) {
	if (!['funcall', 'funexpr', 'var'].includes(obj._type)) {
		console.log(obj);
		throw Error('Assertion failed');
	}

	// don't extend scope/trace
	var scope = parentScope;

	switch (obj._type) {
		case 'funcall':
			return PI.funcall(obj, scope, trace);
		case 'funexpr':
			return PI.fun(obj, scope, trace);
		case 'var':
			if (!scope.hasTypevar(obj.name))
				throw trace.error(`Undefined identifier ${obj.name}`);
			return scope.getTypevar(obj.name);
		default:
			throw Error('wut');
	}
};

PI.metavar = function (obj, parentScope, trace) {
	if (obj._type != 'var')
		throw Error('Assertion failed');

	// don't extend scope/trace
	var scope = parentScope;

	switch (obj.type) {
		case 'ruleset':
			if (!scope.hasRuleset(obj.rulesetName))
				throw trace.error(`Ruleset ${obj.rulesetName} is not defined`);

			var ruleset = scope.getRuleset(obj.rulesetName);

			if (!ruleset.native)
				throw trace.error('Behavior undefined for non-native rulesets');

			var schema = ruleset.native.get(obj.name, scope);

			if (!schema)
				throw trace.error(`Schema ${varObjToString(obj)} not found`);
			
			return schema;
		case 'normal':
			if (!scope.hasSchema(obj.name))
				throw trace.error(`Schema ${obj.name} is not defined`);

			return scope.getSchema(obj.name);
		default:
			throw trace.error(`Unknown type ${obj.type}`);
	}
};

PI.tee = function (obj, parentScope, trace) {
	if (obj._type != 'tee')
		throw Error('Assertion failed');

	var scope = parentScope.extend();
	trace = trace.extend('tee', null, obj.location);

	var foo = obj => PI.metaexpr(obj, scope, trace);

	var left = obj.left.map(foo);
	var right = foo(obj.right);

	if (!(left.every(l => ['type', 'metatype'].includes(l.type._type)))) {
		console.log(left);
		throw trace.error('Assertion failed');
	}

	if (!['type', 'metatype'].includes(right.type._type)) {
		console.log(right);
		throw trace.error('Assertion failed');
	}

	if (right.type.isFunctional) {
		throw trace.error('RHS of a rule cannot be a schema');
	}

	return new Tee({left, right});
};

PI.schema = function (obj, parentScope, trace, nativeMap) {
	if (obj._type != 'defschema' && obj._type != 'schemaexpr')
		throw Error('Assertion failed');

	var scope = parentScope.extend();
	trace = trace.extend('schema', obj.name, obj.location);

	var axiomatic = obj.axiomatic;
	var name = obj.name;

	if (obj.native) {
		if (!nativeMap.schema[name])
			throw trace.error(`Native code for native schema ${name} not found`);

		var native = {
			get: args => nativeMap.schema[name].get(args, scope, ExpressionResolver)
		};

		return new Schema({axiomatic, name, native, doc: obj.doc});
	}

	var params = obj.params.map(tvo => {
		if (!scope.hasType(typeObjToNestedArr(tvo.type)))
			throw trace.error(`Param type ${typeObjToString(tvo.type)} not found`);

		if (scope.hasOwnTypevar(tvo.name))
			throw trace.error(`Param name ${tvo.name} already is there`);

		var tv = PI.typevar(tvo, scope, trace);
		return scope.addTypevar(tv);
	});

	var expr = PI.metaexpr(obj.expr, scope, trace);

	if (!['type', 'metatype'].includes(expr.type._type)) {
		throw trace.error('Assertion failed');
	}

	if (obj._type == 'schemaexpr' && expr.type._type == 'type') {
		return new Fun({
			name,
			type: new Type({
				functional: true,
				from: params.map(typevar => typevar.type),
				to: expr.type
			}),
			params,
			expr,
			doc: obj.doc,
			tex: null
		});
	}

	return new Schema({axiomatic, name, params, expr, doc: obj.doc});
};

PI.schemacall = function (obj, parentScope, trace) {
	if (obj._type != 'schemacall')
		throw Error('Assertion failed');

	var scope = parentScope.extend();
	trace = trace.extend('schemacall', obj.schema.name || null, obj.location);

	var schema = PI.metaexpr(obj.schema, scope, trace);

	if (schema.type._type == 'type') {
		return PI.funcall({
			_type: 'funcall',
			fun: obj.schema,
			args: obj.args,
			location: obj.location
		}, parentScope, trace);
	}

	var args = obj.args.map(obj => {
		return PI.expr0(obj, scope, trace);
	});

	var paramTypes = schema.type.from,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw trace.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw trace.error(`Illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
	}

	return new Schemacall({
		schema,
		args
	});
};

PI.ruleset = function (obj, parentScope, trace, nativeMap) {
	if (obj._type != 'defruleset')
		throw Error('Assertion failed');

	var scope = parentScope.extend();
	trace = trace.extend('ruleset', obj.name, obj.location);

	var axiomatic = obj.axiomatic;
	var name = obj.name;

	if (!obj.native)
		throw trace.error('Assertion failed');

	if (!nativeMap.ruleset[name])
		throw trace.error(`Native code for native ruleset ${name} not found`);

	var native = nativeMap.ruleset[name];

	return new Ruleset({axiomatic, name, native, doc: obj.doc});
};

PI.reduction = function (obj, parentScope, trace) {
	if (obj._type != 'reduction')
		throw Error('Assertion failed');

	var scope = parentScope.extend();
	trace = trace.extend('reduction', obj.subject.name || null, obj.location);

	var subject = PI.metaexpr(obj.subject, scope, trace);

	var args = obj.args.map(obj => {
		return PI.metaexpr(obj, scope, trace);
	});

	if (subject.native) {
		return new Reduction({
			subject,
			args
		});
	}

	var paramTypes = subject.type.left,
		argTypes = args.map(e => e.type);

	if (paramTypes.length != argTypes.length)
		throw trace.error(`Invalid number of arguments (expected ${paramTypes.length}): ${argTypes.length}`);

	for (var i = 0; i < paramTypes.length; i++) {
		if (!paramTypes[i].equals(argTypes[i]))
			throw trace.error(`Illegal argument type (expected ${paramTypes[i]}): ${argTypes[i]}`);
	}

	return new Reduction({
		subject,
		args
	});
};

module.exports = PI;