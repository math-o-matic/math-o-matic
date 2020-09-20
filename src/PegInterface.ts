/*
 * PEG.js의 출력과 적절한 클래스 사이를 잇는 인터페이스.
 * PEG.js의 출력은 여기에서만 처리해야 한다.
 */

import Type from './nodes/Type';
import Typevar from './nodes/Typevar';
import Fun from './nodes/Fun';
import Funcall from './nodes/Funcall';
import Tee from './nodes/Tee';
import Ruleset from './nodes/Ruleset';
import Schema from './nodes/Schema';
import Schemacall from './nodes/Schemacall';
import Reduction from './nodes/Reduction';

import ExpressionResolver from './ExpressionResolver';
import { DefunObject, DefvObject, FunexprObject, StypeObject, TypedefObject, TypeObject, VarObject } from './PegInterfaceDefinitions';
import Scope from './Scope';

function typeObjToString(obj: TypeObject): string {
	if (obj._type != 'type')
		throw Error('Assertion failed');

	if (!obj.ftype) return (obj as StypeObject).name;
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
function typeObjToNestedArr(obj: TypeObject) {
	if (obj._type != 'type')
		throw Error('Assertion failed');

	if (!obj.ftype) {
		obj = obj as StypeObject;

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

function varObjToString(obj: VarObject): string {
	switch (obj.type) {
		case 'ruleset':
			return `${obj.rulesetName}.${obj.name}`;
		case 'normal':
			return `${obj.name}`;
		default:
			throw Error(`Unknown type ${obj.type}`);
	}
}

export default class PI {
	public static type(obj: TypedefObject, parentScope: Scope): Type {
		if (obj._type != 'typedef')
			throw Error('Assertion failed');

		var scope: Scope = parentScope.extend('type', obj.name, obj.location);

		var origin: Type = obj.origin ? scope.getType(typeObjToNestedArr(obj.origin)) : null;

		var name: string = obj.name;
		var doc: string = obj.doc;
		var base: boolean = obj.base;

		if (base && origin) {
			throw scope.error('Base type should not be an alias');
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
	}

	public static typevar(obj: DefvObject | VarObject, parentScope: Scope): Typevar {
		if (!['defv', 'var'].includes(obj._type)) {
			throw Error('Assertion failed');
		}

		var scope = parentScope.extend('typevar', obj.name, obj.location);

		if (obj._type == 'var') {
			if (!scope.hasTypevar(obj.name))
				throw scope.error(`Undefined identifier ${obj.name}`);
			return scope.getTypevar(obj.name);
		}

		if (!scope.hasType(typeObjToNestedArr(obj.type)))
			throw scope.error(`Type ${typeObjToString(obj.type)} is not defined`);

		var type = scope.getType(typeObjToNestedArr(obj.type));

		return new Typevar({
			type,
			isParam: !!obj.isParam,
			guess: obj.guess || null,
			name: obj.name,
			doc: obj.doc,
			tex: obj.tex
		}, scope);
	}

	public static fun(obj: DefunObject | FunexprObject, parentScope: Scope): Fun {
		if (obj._type != 'defun' && obj._type != 'funexpr')
			throw Error('Assertion failed');

		var name = null,
			doc = null,
			tex = null;

		if (obj._type == 'defun') {
			obj = obj as DefunObject
			name = obj.name;
			doc = obj.doc;
			tex = obj.tex;
		}

		var scope = parentScope.extend('fun', name, obj.location);

		var type = null;
		var params = obj.params.map(tvo => {
			if (!scope.hasType(typeObjToNestedArr(tvo.type)))
				throw scope.error(`Type ${typeObjToString(tvo.type)} is not defined`);

			var tv = PI.typevar(tvo, scope);

			if (scope.hasOwnTypevar(tv.name))
				throw tv.scope.error(`Parameter ${tv.name} has already been declared`);

			return scope.addTypevar(tv);
		});
		var expr = null;

		switch (obj._type) {
			case 'defun':
				if (!scope.hasType(typeObjToNestedArr(obj.rettype)))
					throw scope.error(`Type ${typeObjToString(obj.rettype)} is not defined`);

				var rettype = scope.getType(typeObjToNestedArr(obj.rettype));

				if (obj.expr) {
					expr = PI.expr0(obj.expr, scope);
					if (!rettype.equals(expr.type))
						throw scope.error(`Expression type ${expr.type} failed to match the return type ${rettype} of fun ${name}`);
				} else {
					type = new Type({
						functional: true,
						from: params.map(typevar => typevar.type),
						to: rettype
					});
				}
				break;
			case 'funexpr':
				expr = PI.expr0(obj.expr, scope);
				type = null;
				break;
			default:
				throw Error('wut');
		}

		return new Fun({name, type, params, expr, doc, tex}, scope);
	}

	public static funcall(obj, parentScope) {
		if (obj._type != 'funcall')
			throw Error('Assertion failed');

		var scope = parentScope.extend('funcall', obj.fun.name || null, obj.location);

		var fun = PI.expr0(obj.fun, scope);

		var args = obj.args.map(arg => {
			return PI.expr0(arg, scope);
		});

		return new Funcall({fun, args}, scope);
	}

	public static metaexpr(obj, parentScope) {
		if (!['tee', 'reduction', 'schemacall', 'schemaexpr', 'var'].includes(obj._type))
			throw Error('Assertion failed');

		// don't extend scope
		var scope = parentScope;

		switch (obj._type) {
			case 'tee':
				return PI.tee(obj, scope);
			case 'reduction':
				return PI.reduction(obj, scope);
			case 'schemacall':
				return PI.schemacall(obj, scope);
			case 'schemaexpr':
				return PI.schema(obj, scope);
			case 'var':
				return PI.metavar(obj, scope);
			default:
				throw Error('wut');
		}
	}

	public static expr0(obj, parentScope) {
		if (!['funcall', 'funexpr', 'var'].includes(obj._type)) {
			console.log(obj);
			throw Error('Assertion failed');
		}

		// don't extend scope
		var scope = parentScope;

		switch (obj._type) {
			case 'funcall':
				return PI.funcall(obj, scope);
			case 'funexpr':
				return PI.fun(obj, scope);
			case 'var':
				return PI.typevar(obj, scope);
			default:
				throw Error('wut');
		}
	}

	public static metavar(obj, parentScope) {
		if (obj._type != 'var')
			throw Error('Assertion failed');

		// don't extend scope
		var scope = parentScope;

		switch (obj.type) {
			case 'ruleset':
				if (!scope.hasRuleset(obj.rulesetName))
					throw scope.error(`Ruleset ${obj.rulesetName} is not defined`);

				var ruleset = scope.getRuleset(obj.rulesetName);

				if (!ruleset.native)
					throw scope.error('Behavior undefined for non-native rulesets');

				var schema = ruleset.native.get(obj.name, scope);

				if (!schema)
					throw scope.error(`Schema ${varObjToString(obj)} is not defined`);
				
				return schema;
			case 'normal':
				if (!scope.hasSchema(obj.name))
					throw scope.error(`Schema ${obj.name} is not defined`);

				return scope.getSchema(obj.name);
			default:
				throw scope.error(`Unknown type ${obj.type}`);
		}
	}

	public static tee(obj, parentScope) {
		if (obj._type != 'tee')
			throw Error('Assertion failed');

		var scope = parentScope.extend('tee', null, obj.location);

		var foo = obj => PI.metaexpr(obj, scope);

		var left = obj.left.map(foo);
		var right = foo(obj.right);

		return new Tee({left, right}, scope);
	}

	public static schema(obj, parentScope, nativeMap?) {
		if (obj._type != 'defschema' && obj._type != 'schemaexpr')
			throw Error('Assertion failed');

		nativeMap = nativeMap || {};

		var scope = parentScope.extend('schema', obj.name, obj.location);

		var axiomatic = obj.axiomatic;
		var name = obj.name;

		if (obj.native) {
			if (!nativeMap.schema[name])
				throw scope.error(`Native code for native schema ${name} not found`);

			var native = {
				get: args => nativeMap.schema[name].get(args, scope, ExpressionResolver)
			};

			return new Schema({axiomatic, name, native, doc: obj.doc}, scope);
		}

		var params = obj.params.map(tvo => {
			if (!scope.hasType(typeObjToNestedArr(tvo.type)))
				throw scope.error(`Type ${typeObjToString(tvo.type)} is not defined`);

			var tv = PI.typevar(tvo, scope);

			if (scope.hasOwnTypevar(tv.name))
				throw tv.scope.error(`Parameter ${tv.name} has already been declared`);
			
			return scope.addTypevar(tv);
		});

		var expr = PI.metaexpr(obj.expr, scope);

		return new Schema({axiomatic, name, params, expr, doc: obj.doc}, scope);
	}

	public static schemacall(obj, parentScope) {
		if (obj._type != 'schemacall')
			throw Error('Assertion failed');

		var scope = parentScope.extend('schemacall', obj.schema.name || null, obj.location);

		var schema = PI.metaexpr(obj.schema, scope);

		if (schema.type._type == 'type') {
			return PI.funcall({
				_type: 'funcall',
				fun: obj.schema,
				args: obj.args,
				location: obj.location
			}, parentScope);
		}

		var args = obj.args.map(obj => {
			return PI.expr0(obj, scope);
		});

		return new Schemacall({
			schema,
			args
		}, scope);
	}

	public static ruleset(obj, parentScope, nativeMap) {
		if (obj._type != 'defruleset')
			throw Error('Assertion failed');

		var scope = parentScope.extend('ruleset', obj.name, obj.location);

		var axiomatic = obj.axiomatic;
		var name = obj.name;

		if (!obj.native)
			throw scope.error('Assertion failed');

		if (!nativeMap.ruleset[name])
			throw scope.error(`Native code for native ruleset ${name} not found`);

		var native = nativeMap.ruleset[name];

		return new Ruleset({axiomatic, name, native, doc: obj.doc}, scope);
	}

	public static reduction(obj, parentScope) {
		if (obj._type != 'reduction')
			throw Error('Assertion failed');

		var scope = parentScope.extend('reduction', obj.subject.name || null, obj.location);

		var subject = PI.metaexpr(obj.subject, scope);

		var guesses = !obj.guesses
			? null
			: obj.guesses.map(g => {
				return g && PI.expr0(g, scope);
			});

		var leftargs = obj.leftargs.map(obj => {
			return PI.metaexpr(obj, scope);
		});

		return new Reduction({
			subject,
			guesses,
			leftargs
		}, scope);
	}
}