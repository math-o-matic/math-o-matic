import Scope from '../Scope';
import Expr0 from './Expr0';
import Funcall from './Funcall';
import Metaexpr, { EqualsPriority } from './Metaexpr';
import MetaType from './MetaType';
import Nameable from './Nameable';
import Node from './Node';
import ObjectType from './ObjectType';
import Type from './Type';
import Variable from './Variable';

interface FunArgumentType {
	doc?: string;
	tex?: string;
	annotations: string[];
	type?: Type;
	name?: string;
	params: Variable[];
	expr?: Metaexpr;
}

export default abstract class Fun extends Expr0 implements Nameable {

	public readonly annotations: string[];
	public readonly name: string;
	public readonly params: Variable[];
	public readonly expr: Metaexpr;

	/*
	 * name, expr 중 하나 이상 있어야 하고 type, expr 중
	 * 한 개만 있어야 한다.
	 */
	constructor ({doc, tex, annotations, type, /* nullable */ name, params, expr}: FunArgumentType, scope?: Scope) {
		if (!name && !expr)
			throw Node.error('Anonymous fun cannot be primitive', scope);

		if (type && expr)
			throw Node.error('no', scope);

		if (!type && !expr)
			throw Node.error('Cannot guess the type of a primitive fun', scope);

		if (name !== null && typeof name != 'string')
			throw Node.error('Assertion failed', scope);
		
		if (!(params instanceof Array)
				|| params.map(e => e instanceof Variable).some(e => !e))
			throw Node.error('Assertion failed', scope);
		
		if (expr !== null && !(expr instanceof Node))
			throw Node.error('Assertion failed', scope);
		
		var precedence = false;

		if (tex) {
			var parsed = Node.parseTeX(tex);
			precedence = parsed.precedence;
			tex = parsed.code;
		} else {
			tex = null;
		}
		
		super(
			scope, doc, tex,
			type || new (expr.type instanceof ObjectType ? ObjectType : MetaType)({
				functional: true,
				from: params.map(variable => variable.type),
				to: expr.type as any
			})
		);

		this.annotations = annotations;
		this.precedence = precedence;
		this.name = name;
		this.params = params;
		this.expr = expr;
	}

	public isProved(hyps?) {
		hyps = hyps || [];
		
		return super.isProved(hyps)
			|| this.expr && this.expr.isProved(hyps);
	}

	protected getEqualsPriority(): EqualsPriority {
		return EqualsPriority.ONE;
	}
	
	protected equalsInternal(obj: Metaexpr): boolean {
		var placeholders = [];
		var types = (this.type.resolve() as ObjectType | MetaType).from;
		var len = types.length;

		for (var i = 0; i < len; i++) {
			placeholders.push(new Variable({
				isParam: true,
				type: types[i],
				name: '$' + i
			}));
		}

		return new Funcall({
			fun: this,
			args: placeholders
		}).equals(new Funcall({
			fun: obj,
			args: placeholders
		}));
	}

	public call(args: Expr0[]): Metaexpr {
		if (!this.expr) {
			throw Error('Cannot call a callable without a body');
		}

		if (this.params.length != args.length) {
			throw Error('Illegal arguments length');
		}

		var map: Map<Variable, Expr0> = new Map();

		for (var i = 0; i < this.params.length; i++) {
			map.set(this.params[i], args[i]);
		}

		return this.expr.substitute(map);
	}
}

