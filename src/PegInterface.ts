/*
 * PEG.js의 출력과 적절한 클래스 사이를 잇는 인터페이스.
 * PEG.js의 출력은 여기에서만 처리해야 한다.
 */

import Type from './nodes/Type';
import Typevar from './nodes/Typevar';
import Tee from './nodes/Tee';
import Fun from './nodes/Fun';
import Funcall from './nodes/Funcall';
import Reduction from './nodes/Reduction';

import { Expr0, Metaexpr } from './ExpressionResolver';
import { Def$Object, DefschemaObject, DefunObject, DefvObject, Expr0Object, FuncallObject, FunexprObject, MetaexprObject, ReductionObject, SchemacallObject, SchemaexprObject, StypeObject, TeeObject, TypedefObject, TypeObject, VarObject } from './PegInterfaceDefinitions';
import Scope, { NestedTypeInput } from './Scope';
import $var from './nodes/$var';

function typeObjToString(obj: TypeObject): string {
	if (obj._type != 'type')
		throw Error('Assertion failed');

	if (!obj.ftype) return (obj as StypeObject).name;
	return '[' + obj.from.map(typeObjToString).join(', ') + ' -> '
			+ typeObjToString(obj.to) + ']';
}

/*
 * Scope#getType이나 Scope#hasType 등의 입력 형태로 바꾼다.
 * st						-> 'st'
 * [cls -> st]				-> ['cls', 'st']
 * [(cls, cls) -> st]		-> ['cls', 'cls', 'st']
 * [[cls -> st] -> st]		-> [['cls', 'st'], 'st']
 */
function typeObjToNestedArr(obj: TypeObject): NestedTypeInput {
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
		case '@':
			return `@${obj.name}`;
		case '$':
			return `${obj.name}`;
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

	public static typevar(obj: DefvObject | VarObject, parentScope: Scope): Typevar | Fun {
		if (!['defv', 'var'].includes(obj._type)) {
			throw Error('Assertion failed');
		}

		var scope = parentScope.extend('typevar', obj.name, obj.location);

		if (obj._type == 'var') {
			if (obj.type != 'normal') {
				throw scope.error(`Variable type ${obj.type} not allowed`);
			}

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
			obj = obj as DefunObject;
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

		return new Fun({shouldValidate: false, annotations: [], name, type, params, expr, doc, tex}, scope);
	}

	public static funcall(obj: FuncallObject, parentScope: Scope): Funcall {
		if (obj._type != 'funcall')
			throw Error('Assertion failed');

		var scope = parentScope.extend('funcall', 'name' in obj.schema ? obj.schema.name : null, obj.location);

		var fun = PI.expr0(obj.schema, scope);

		var args = obj.args.map(arg => {
			return PI.expr0(arg, scope);
		});

		return new Funcall({fun, args}, scope);
	}

	public static metaexpr(obj: MetaexprObject, parentScope: Scope): Metaexpr {
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

	public static expr0(obj: Expr0Object, parentScope: Scope): Expr0 {
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

	public static metavar(obj: VarObject, parentScope: Scope): Metaexpr {
		if (obj._type != 'var')
			throw Error('Assertion failed');

		// don't extend scope
		var scope = parentScope;

		switch (obj.type) {
			case '@':
				if (obj.name.match(/^h[0-9]+$/)) {
					var hypnum = Number(obj.name.slice(1)) - 1;
					if (hypnum >= scope.hypotheses.length) {
						throw scope.error(`Hypothesis #${hypnum + 1} not found`);
					}

					return scope.hypotheses[hypnum];
				}

				throw scope.error(`Unknown selector query @${obj.name}`);
			case '$':
				if (!scope.has$(obj.name)) {
					throw scope.error(`${obj.name} is not defined`);
				}

				return scope.get$(obj.name);
			case 'normal':
				if (!scope.hasSchema(obj.name))
					throw scope.error(`Schema ${obj.name} is not defined`);

				return scope.getSchema(obj.name);
			default:
				throw scope.error(`Unknown type ${obj.type}`);
		}
	}

	public static tee(obj: TeeObject, parentScope: Scope): Tee {
		if (obj._type != 'tee')
			throw Error('Assertion failed');

		var scope = parentScope.extend('tee', null, obj.location);

		var left = obj.left.map(o => PI.metaexpr(o, scope));

		var scopeRight = scope.extend('tee.right', null, obj.right.location);
		left.forEach(l => scopeRight.hypotheses.push(l));

		var def$s = obj.def$s.map($ => {
			var $v = PI.def$($, scopeRight);

			if (scopeRight.hasOwn$($v.name)) {
				throw scopeRight.error(`${$.name} has already been declared`);
			}

			return scopeRight.add$($v);
		});

		var right = PI.metaexpr(obj.right, scopeRight);

		return new Tee({left, def$s, right}, scope);
	}

	public static def$(obj: Def$Object, parentScope: Scope): $var {
		if (obj._type != 'def$')
			throw Error('Assertion failed');
		
		var scope = parentScope.extend('def$', obj.name, obj.location);
		
		var expr = PI.metaexpr(obj.expr, scope);

		return new $var({name: obj.name, expr}, scope);
	}

	public static schema(obj: DefschemaObject | SchemaexprObject, parentScope: Scope): Fun {
		if (obj._type != 'defschema' && obj._type != 'schemaexpr')
			throw Error('Assertion failed');

		var name: string = null,
			axiomatic: boolean = false,
			doc: string = null,
			annotations: string[] = [];

		if (obj._type == 'defschema') {
			name = obj.name; axiomatic = obj.axiomatic;
			doc = obj.doc; annotations = obj.annotations;
		}

		var scope = parentScope.extend('schema', name, obj.location);

		var params = obj.params.map(tvo => {
			if (!scope.hasType(typeObjToNestedArr(tvo.type)))
				throw scope.error(`Type ${typeObjToString(tvo.type)} is not defined`);

			var tv = PI.typevar(tvo, scope);

			if (scope.hasOwnTypevar(tv.name))
				throw tv.scope.error(`Parameter ${tv.name} has already been declared`);
			
			return scope.addTypevar(tv);
		});

		var def$s = obj.def$s.map($ => {
			var $v = PI.def$($, scope);

			if (scope.hasOwn$($v.name)) {
				throw scope.error(`${$.name} has already been declared`);
			}

			return scope.add$($v);
		});

		var expr = PI.metaexpr(obj.expr, scope);

		return new Fun({shouldValidate: true, doc, annotations, axiomatic, name, params, def$s, expr}, scope);
	}

	public static schemacall(obj: SchemacallObject, parentScope: Scope): Funcall {
		if (obj._type != 'schemacall')
			throw Error('Assertion failed');

		var scope = parentScope.extend('schemacall', 'name' in obj.schema ? obj.schema.name : null, obj.location);

		var fun = PI.metaexpr(obj.schema, scope);

		var args = obj.args.map(obj => {
			return PI.expr0(obj, scope);
		});

		return new Funcall({
			fun,
			args
		}, scope);
	}

	public static reduction(obj: ReductionObject, parentScope: Scope): Reduction {
		if (obj._type != 'reduction')
			throw Error('Assertion failed');

		var scope = parentScope.extend('reduction', 'name' in obj.subject ? obj.subject.name : null, obj.location);

		var subject = PI.metaexpr(obj.subject, scope);

		var guesses = !obj.guesses
			? null
			: obj.guesses.map(g => {
				return g && PI.expr0(g, scope);
			});

		var leftargs = obj.leftargs.map(obj => {
			return PI.metaexpr(obj, scope);
		});

		var expected = obj.expected && PI.metaexpr(obj.expected, scope);

		return new Reduction({
			subject,
			guesses,
			leftargs,
			expected
		}, scope);
	}
}