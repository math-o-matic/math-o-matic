/*
 * PEG.js의 출력과 적절한 클래스 사이를 잇는 인터페이스.
 * PEG.js의 출력은 여기에서만 처리해야 한다.
 */

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
		case '$':
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

		var expr: Type | null = obj.expr ? scope.getType(typeObjToNestedArr(obj.expr)) : null;

		var name: string = obj.name;
		var doc: string = obj.doc;

		if (expr) {
			return new SimpleType({
				doc,
				name,
				expr
			}, scope.trace);
		}

		return new SimpleType({
			doc,
			name,
			expr: null
		}, scope.trace);
	}

	public static variable(obj: DefvObject | VarObject, parentScope: Scope): Variable {
		if (!['defv', 'var'].includes(obj._type)) {
			throw Error('Assertion failed');
		}

		var scope = parentScope.extend('variable', obj.name, obj.location);

		if (obj._type == 'var') {
			if (obj.type != 'normal') {
				throw scope.error(`Variable type ${obj.type} not allowed`);
			}

			if (!scope.hasVariable(obj.name))
				throw scope.error(`Undefined identifier ${varObjToString(obj)}`);
			return scope.getVariable(obj.name);
		}

		if (!scope.hasType(typeObjToNestedArr(obj.type)))
			throw scope.error(`Type ${typeObjToString(obj.type)} is not defined`);

		var type = scope.getType(typeObjToNestedArr(obj.type));

		var expr = obj.expr ? PI.objectexpr(obj.expr, scope) : null;

		if (obj.isParam) {
			return new Parameter({
				decoration: new SimpleAtomicDecoration({
					doc: obj.doc,
					tex: obj.tex
				}),
				type,
				name: obj.name,
				selector: obj.selector || null
			}, scope.trace);
		}

		return new Variable({
			decoration: expr
				? new SimpleMacroDecoration({
					doc: obj.doc,
					tex: obj.tex,
					sealed: !!obj.sealed
				})
				: new SimpleAtomicDecoration({
					doc: obj.doc,
					tex: obj.tex
				}),
			type,
			name: obj.name,
			expr: expr || null
		}, scope.trace);
	}

	public static fun(obj: DefunObject | FunexprObject, parentScope: Scope): Variable | Fun {
		if (obj._type != 'defun' && obj._type != 'funexpr')
			throw Error('Assertion failed');
		
		var scope = parentScope.extend('fun', obj._type == 'defun' ? obj.name : '<anonymous>', obj.location);

		var params = obj.params.map(tvo => {
			var tv = PI.variable(tvo, scope);

			if (scope.hasOwnVariable(tv.name))
				throw scope.error(`Parameter ${tv.name} has already been declared`);
			
			if (!(tv instanceof Parameter)) {
				throw Error('Something\'s wrong');
			}

			scope.addVariable(tv);
			return tv;
		});

		if (obj._type == 'defun') {
			var doc = obj.doc;
			var precedence = new Precedence(obj.tex_attributes.precedence);
			var tex = obj.tex;
			var sealed = obj.sealed;
			
			if (!scope.hasType(typeObjToNestedArr(obj.rettype))) {
				throw scope.error(`Type ${typeObjToString(obj.rettype)} is not defined`);
			}

			var rettype = scope.getType(typeObjToNestedArr(obj.rettype));
			var name = obj.name;
			var expr = obj.expr ? PI.objectexpr(obj.expr, scope) : null;

			return new Variable({
				decoration: expr
					? new FunctionalMacroDecoration({
						doc, precedence, tex, sealed
					})
					: new FunctionalAtomicDecoration({
						doc, precedence, tex, params
					}),
				type: new FunctionalType({
					from: params.map(p => p.type),
					to: rettype
				}, scope.trace),
				name,
				expr: expr ? new Fun({
					params, def$s: [], expr
				}, scope.trace) : null
			}, scope.trace);
		}

		if (obj._type == 'funexpr') {
			let expr = PI.objectexpr(obj.expr, scope);

			return new Fun({
				params,
				def$s: [],
				expr
			}, scope.trace);
		}

		throw Error('wut');
	}

	public static funcall(obj: FuncallObject, parentScope: Scope): Funcall {
		if (obj._type != 'funcall')
			throw Error('Assertion failed');

		var scope = parentScope.extend('funcall', 'name' in obj.schema ? obj.schema.name : null, obj.location);

		var fun = PI.objectexpr(obj.schema, scope);

		var args = obj.args.map(arg => {
			return PI.objectexpr(arg, scope);
		});

		return new Funcall({fun, args}, scope.trace);
	}

	public static expr(obj: ExprObject, parentScope: Scope, context: ExecutionContext | null): Expr {
		if (!['conditional', 'reduction', 'schemacall', 'schemaexpr', 'var', 'with'].includes(obj._type)) {
			throw Error('Assertion failed');
		}

		// don't extend scope
		var scope = parentScope;

		switch (obj._type) {
			case 'conditional':
				return PI.conditional(obj, scope, context);
			case 'reduction':
				return PI.reduction(obj, scope, context);
			case 'schemacall':
				return PI.schemacall(obj, scope, context);
			case 'schemaexpr':
				return PI.schema(obj, scope, context);
			case 'var':
				return PI.metavar(obj, scope);
			case 'with':
				return PI.with(obj, scope, context);
			default:
				throw Error('wut');
		}
	}

	public static objectexpr(obj: ObjectExprObject, parentScope: Scope): Expr {
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
				return PI.variable(obj, scope);
			default:
				throw Error('wut');
		}
	}

	public static metavar(obj: VarObject, parentScope: Scope): Expr {
		if (obj._type != 'var')
			throw Error('Assertion failed');

		// don't extend scope
		var scope = parentScope;

		switch (obj.type) {
			case '@':
				if (obj.name.match(/^@h[0-9]+$/)) {
					var numstring = obj.name.slice(2);

					// one-based
					var hypothesisNo = Number(numstring);

					if (hypothesisNo == 0) {
						throw scope.error(`@h0 is not allowed; hypothesis number starts from one`);
					}

					if (numstring[0] == '0') {
						throw scope.error(`Hypothesis number cannot start with a 0`);
					}

					if (numstring.length >= 16 /* String(Number.MAX_SAFE_INTEGER).length */) {
						throw scope.error(`Hypothesis number insanely big`);
					}

					if (hypothesisNo > scope.hypotheses.length) {
						throw scope.error(`Hypothesis #${hypothesisNo} not found; there are only ${scope.hypotheses.length} hypotheses available`);
					}

					return scope.hypotheses[hypothesisNo - 1];
				}

				throw scope.error(`Unknown selector query ${varObjToString(obj)}`);
			case '$':
				if (!scope.has$(obj.name)) {
					throw scope.error(`${varObjToString(obj)} is not defined`);
				}

				return scope.get$(obj.name);
			case 'normal':
				if (!scope.hasVariable(obj.name))
					throw scope.error(`Schema ${varObjToString(obj)} is not defined`);

				return scope.getVariable(obj.name);
			default:
				throw scope.error(`Unknown type ${obj.type}`);
		}
	}

	public static with(obj: WithObject, parentScope: Scope, context: ExecutionContext | null): With {
		if (obj._type != 'with') {
			throw Error('Assertion failed');
		}

		var scope = parentScope.extend('with', null, obj.location);

		var tv = PI.variable(obj.with, scope);

		if (scope.hasOwnVariable(tv.name))
			throw scope.error(`Parameter ${tv.name} has already been declared`);
		
		if (!(tv instanceof Variable)) {
			throw Error('Something\'s wrong');
		}

		scope.addVariable(tv);

		var def$s = obj.def$s.map($ => {
			var $v = PI.def$($, scope, context);

			if (scope.hasOwn$($v.name)) {
				throw scope.error(`${$.name} has already been declared`);
			}

			return scope.add$($v);
		});

		var expr = PI.expr(obj.expr, scope, context);

		return new With({
			variable: tv,
			def$s,
			expr
		}, scope.trace);
	}

	public static conditional(obj: ConditionalObject, parentScope: Scope, context: ExecutionContext | null): Conditional {
		if (obj._type != 'conditional')
			throw Error('Assertion failed');

		var scope = parentScope.extend('conditional', null, obj.location);

		var left = obj.left.map(o => PI.expr(o, scope, context));

		var scopeRight = scope.extend('conditional.right', null, obj.right.location);
		left.forEach(l => scopeRight.hypotheses.push(l));

		var def$s = obj.def$s.map($ => {
			var $v = PI.def$($, scopeRight, context);

			if (scopeRight.hasOwn$($v.name)) {
				throw scopeRight.error(`${$.name} has already been declared`);
			}

			return scopeRight.add$($v);
		});

		var right = PI.expr(obj.right, scopeRight, context);

		return new Conditional({left, def$s, right}, scope.trace);
	}

	public static def$(obj: Def$Object, parentScope: Scope, context: ExecutionContext | null): $Variable {
		if (obj._type != 'def$')
			throw Error('Assertion failed');
		
		var scope = parentScope.extend('def$', obj.name, obj.location);
		
		var expr = PI.expr(obj.expr, scope, context);

		return new $Variable({name: obj.name, expr}, scope.trace);
	}

	public static schema(obj: DefschemaObject | SchemaexprObject, parentScope: Scope, oldContext: ExecutionContext | null): Variable | Fun {
		if (obj._type != 'defschema' && obj._type != 'schemaexpr')
			throw Error('Assertion failed');
		
		var name = obj._type == 'defschema' ? obj.name : null;

		var scope = parentScope.extend('schema', name, obj.location);

		var schemaType: SchemaType = 'schema',
			doc: string | null = null,
			context = oldContext;

		if (obj._type == 'defschema') {
			schemaType = obj.schemaType;
			doc = obj.doc;

			if (oldContext) {
				console.log(oldContext);
				throw Error('duh');
			}

			var using: Variable[] = obj.using.map(name => {
				if (!scope.hasVariable(name)) {
					throw scope.error(`Variable ${name} is not defined`);
				}

				var fun = scope.getVariable(name);

				if (!fun.expr) {
					throw scope.error(`${name} is not a macro`);
				}

				return fun;
			});

			context = new ExecutionContext(using);
		}

		var params = obj.params.map(tvo => {
			var tv = PI.variable(tvo, scope);

			if (scope.hasOwnVariable(tv.name))
				throw scope.error(`Parameter ${tv.name} has already been declared`);
			
			if (!(tv instanceof Parameter)) {
				throw Error('Something\'s wrong');
			}

			scope.addVariable(tv);
			return tv;
		});

		var def$s = obj.def$s.map($ => {
			var $v = PI.def$($, scope, context);

			if (scope.hasOwn$($v.name)) {
				throw scope.error(`${$.name} has already been declared`);
			}

			return scope.add$($v);
		});

		var expr = PI.expr(obj.expr, scope, context);

		if (obj._type == 'defschema') {
			if (!name) throw scope.error('wut');
			
			return new Variable({
				decoration: new SchemaDecoration({
					doc, schemaType, context: context!
				}),
				type: new FunctionalType({
					from: params.map(p => p.type),
					to: expr.type
				}, scope.trace),
				name,
				expr: new Fun({
					params, def$s, expr
				}, scope.trace)
			}, scope.trace);
		}
		
		if (obj._type == 'schemaexpr') {
			return new Fun({
				params,
				def$s,
				expr
			}, scope.trace);
		}

		throw Error('wut');
	}

	public static schemacall(obj: SchemacallObject, parentScope: Scope, context: ExecutionContext | null): Funcall {
		if (obj._type != 'schemacall')
			throw Error('Assertion failed');

		var scope = parentScope.extend('schemacall', 'name' in obj.schema ? obj.schema.name : null, obj.location);

		var fun = PI.expr(obj.schema, scope, context);

		var args = obj.args.map(obj => {
			return PI.objectexpr(obj, scope);
		});

		return new Funcall({
			fun,
			args
		}, scope.trace);
	}

	public static reduction(obj: ReductionObject, parentScope: Scope, context: ExecutionContext | null): Reduction {
		if (obj._type != 'reduction')
			throw Error('Assertion failed');
		
		if (!context) {
			throw Error('duh');
		}

		var scope = parentScope.extend('reduction', 'name' in obj.subject ? obj.subject.name : null, obj.location);

		var subject = PI.expr(obj.subject, scope, context);

		var args = !obj.args
			? null
			: obj.args.map(g => {
				return g && PI.objectexpr(g, scope);
			});

		var antecedents = obj.antecedents.map(obj => {
			return PI.expr(obj, scope, context);
		});

		var as = obj.as && PI.expr(obj.as, scope, context);

		return new Reduction({
			subject,
			args,
			antecedents,
			as
		}, context, scope.trace);
	}

	public static defsystem(obj: DefsystemObject, parentScope: FileScope): SystemScope {
		var scope = new SystemScope(parentScope, obj.name, parentScope.trace.extend({
			type: 'system',
			name: obj.name,
			location: obj.location
		}));

		var allInheritedTypesMap = new Map<string, SimpleType>(),
			allInheritedVariablesMap = new Map<string, Variable>();

		if (new Set(obj.extends_).size != obj.extends_.length) {
			throw scope.error(`Cannot extend the same system more than twice`);
		}

		for (var extendName of obj.extends_) {
			var super_ = parentScope.getSystem(extendName);

			for (let [k, v] of super_.typeMap) {
				if (allInheritedTypesMap.has(k)
						&& allInheritedTypesMap.get(k)! != v) {
					throw scope.error(`Conflicting definition for the inherited type ${k}`);
				}

				allInheritedTypesMap.set(k, v);
			}

			for (let [k, v] of super_.variableMap) {
				if (allInheritedVariablesMap.has(k)
						&& allInheritedVariablesMap.get(k)! != v) {
					throw scope.error(`Conflicting definition for the inherited variable ${k}`);
				}

				allInheritedVariablesMap.set(k, v);
			}

			scope.extendsMap.set(super_.name, super_);
		}

		for (var line of obj.lines) {
			switch (line._type) {
				case 'typedef':
					var type = PI.type(line, scope) as SimpleType;

					if (scope.hasType(type.name)) {
						throw scope.error(`Type ${type.name} has already been declared`);
					}

					scope.addType(type);
					break;
				case 'defv':
					var variable = PI.variable(line, scope);

					if (scope.hasVariable(variable.name)) {
						throw scope.error(`Definition ${variable.name} has already been declared`);
					}

					scope.addVariable(variable);
					break;
				case 'defun':
					var fun = PI.fun(line, scope);

					if (fun instanceof Fun) {
						throw Error('wut');
					}

					if (scope.hasVariable(fun.name)) {
						throw scope.error(`Definition ${fun.name} has already been declared`);
					}

					scope.addVariable(fun);
					break;
				case 'defschema':
					var schema = PI.schema(line, scope, null);

					if (schema instanceof Fun) {
						throw Error('wut');
					}

					if (scope.hasVariable(schema.name)) {
						throw scope.error(`Schema ${schema.name} has already been declared`);
					}

					scope.addVariable(schema);
					break;
				default:
					throw Error(`Unknown line type ${(line as any)._type}`);
			}
		}

		return scope;
	}
}

import ExecutionContext from './ExecutionContext';
import $Variable from './expr/$Variable';
import Fun from './expr/Fun';
import Funcall from './expr/Funcall';
import Expr from './expr/Expr';
import Parameter from './expr/Parameter';
import Reduction from './expr/Reduction';
import Conditional from './expr/Conditional';
import Variable from './expr/Variable';
import With from './expr/With';
import { Def$Object, DefschemaObject, DefunObject, DefvObject, ObjectExprObject, FuncallObject, FunexprObject, ExprObject, ReductionObject, SchemacallObject, SchemaexprObject, StypeObject, ConditionalObject, TypedefObject, TypeObject, VarObject, WithObject, DefsystemObject } from './PegInterfaceDefinitions';
import Scope, { NestedTypeInput } from './scope/Scope';
import Precedence from './Precedence';
import SimpleAtomicDecoration from './decoration/SimpleAtomicDecoration';
import SimpleMacroDecoration from './decoration/SimpleMacroDecoration';
import FunctionalMacroDecoration from './decoration/FunctionalMacroDecoration';
import FunctionalAtomicDecoration from './decoration/FunctionalAtomicDecoration';
import SchemaDecoration, { SchemaType } from './decoration/SchemaDecoration';
import { FunctionalType } from './type/FunctionalType';
import { SimpleType } from './type/SimpleType';
import Type from './type/Type';
import FileScope from './scope/FileScope';
import SystemScope from './scope/SystemScope';
