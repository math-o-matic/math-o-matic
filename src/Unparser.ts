import { Def$Object, DefvObject, ObjectExprObject, StartObject, ExprObject, StypeObject, TypeObject, LineObject, DefpackageObject, ImportObject, DefsystemObject } from "./PegInterfaceDefinitions";

export default function unparse(start: StartObject) {
	var ret = '';

	if (start.defpackage) {
		ret += recurse(start.defpackage, Context.NORMAL, 0) + '\n\n';
	}

	if (start.imports.length) {
		for (var importObject of start.imports) {
			ret += recurse(importObject, Context.NORMAL, 0) + '\n';
		}
	
		ret += '\n';
	}

	for (var defsystemObject of start.systems) {
		ret += recurse(defsystemObject, Context.NORMAL, 0) + '\n\n';
	}

	return ret;
}

enum Context {
	CALLEE, CONDITIONALLEFT, REDUCTIONRIGHT, REDUCTIONLEFT, NORMAL
}

function isOneLiner(s: string) {
	return s.indexOf('\n') < 0 && s.length <= 80;
}

function recurse(
		line: DefpackageObject | ImportObject | DefsystemObject | LineObject | Def$Object | ExprObject | ObjectExprObject | TypeObject,
		context: Context,
		indent: number): string {
	return recurseInternal(line, context)
		.replace(/(?<=\n)\s+(?=\n)/g, '');
}

function recurseInternal(
		line: DefpackageObject | ImportObject | DefsystemObject | LineObject | Def$Object | ExprObject | ObjectExprObject | TypeObject,
		context: Context): string {
	
	function defv(line: DefvObject, param: boolean) {
		/* export interface DefvObject {
			_type: 'defv';
			isParam: boolean;
			selector?: string;
			doc: string;
			tex: string;
			sealed?: boolean;
			type: TypeObject;
			name: string;
			expr?: ObjectExprObject;
			location: LocationObject;
		} */
		var s = param ? ' ' : '\n';
		return `${
	line.doc ? `"${line.doc}"` + s : ''
}${
	line.tex ? `$${line.tex}$` + s : ''
}${line.sealed ? 'sealed ' : ''}${recurse(line.type, Context.NORMAL, 0)} ${line.name}${
	line.selector ? ': @' + line.selector : ''
}${
	line.expr ? ' = ' + recurse(line.expr, Context.NORMAL, 0) : ''
}${param ? '' : ';'}`;
	}

	switch (line._type) {
		case 'defpackage':
			/* export interface DefpackageObject {
				_type: 'defpackage';
				name: string;
				location: LocationObject;
			} */
			return `package ${line.name};`;
		case 'defsystem':
			/* export interface DefsystemObject {
				_type: 'defsystem';
				name: string;
				extends_: string[];
				lines: LineObject[];
				location: LocationObject;
			} */
			return `system ${line.name}${
	line.extends_.length ? ` extends ${line.extends_.join(', ')}` : ''
} {
	${line.lines.map(line => recurse(line, Context.NORMAL, 1)).join('\n\n\t')}
}`
			break;
		case 'defschema':
			/* export interface DefschemaObject {
				_type: 'defschema';
				doc: string;
				schemaType: SchemaType,
				name: string;
				params: DefvObject[];
				using: string[];
				def$s: Def$Object[];
				expr: ExprObject;
				location: LocationObject;
			} */
			return `${
	line.doc ? `"${line.doc}"\n` : ''
}${line.schemaType} ${line.name}(${
	line.params.map(param => recurse(param, Context.NORMAL, 0)).join(', ')
})${line.using.length ? ' using ' + line.using.join(', ') : ''} {
	${line.def$s.map(def$ => recurse(def$, Context.NORMAL, 1) + '\n\n\t').join('')}${
		recurse(line.expr, Context.NORMAL, 1)
	}
}`;
		case 'defun':
			/* export interface DefunObject {
				_type: 'defun';
				doc: string;
				tex: string;
				tex_attributes: {
					precedence: number
				};
				sealed: boolean;
				rettype: TypeObject;
				name: string;
				params: DefvObject[];
				expr: ObjectExprObject;
				location: LocationObject;
			} */
			return `${
	line.doc ? `"${line.doc}"\n` : ''
}${typeof line.tex_attributes.precedence == 'number' ? `[precedence=${line.tex_attributes.precedence}]\n` : ''}${
	line.tex ? `$${line.tex}$\n` : ''
}${line.sealed ? 'sealed ' : ''}${recurse(line.rettype, Context.NORMAL, 0)} ${line.name}(${
	line.params.map(param => recurse(param, Context.NORMAL, 0)).join(', ')
})${
	line.expr
		? ` {
	${recurse(line.expr, Context.NORMAL, 1)}
}`
		: ';'
}`;
		case 'defv':
			return defv(line, line.isParam);
		case 'import':
			/* export interface ImportObject {
				_type: 'import';
				filename: string;
				location: LocationObject;
			} */
			return `import ${line.name};`;
		case 'typedef':
			/* export interface TypedefObject {
				_type: 'typedef';
				doc: string;
				expr: FtypeObject;
				name: string;
				location: LocationObject;
			} */
			return `${
	line.doc ? `"${line.doc}"\n` : ''
}type ${line.name}${
	line.expr ? ' = ' + recurse(line.expr, Context.NORMAL, 0) : ''
};`;
		case 'def$':
			/* export interface Def$Object {
				_type: 'def$';
				name: string;
				expr: ExprObject;
				location: LocationObject;
			} */
			return `${line.name} = ${recurse(line.expr, Context.NORMAL, 0)};`;
		case 'conditional':
			/* export interface ConditionalObject {
				_type: 'conditional';
				left: ExprObject[];
				def$s: Def$Object[];
				right: ExprObject;
				location: LocationObject;
			} */
			if (context <= Context.CONDITIONALLEFT)
				return '(' + recurse(line, Context.NORMAL, 0) + ')';
			
			var left = !line.left.length
				? ''
				: line.left.map(left => recurse(left, Context.CONDITIONALLEFT, 0))
					.reduce((l, r) => {
						if (!isOneLiner(r)) return l + ',\n' + r;

						var lastLine = l.lastIndexOf('\n') < 0
							? l
							: l.substring(l.lastIndexOf('\n') + 1);
						
						if (isOneLiner(lastLine + ', ' + r)) return l + ', ' + r;

						return l + ',\n' + r;
					});
			var def$s = line.def$s.map(def$ => recurse(def$, Context.NORMAL, 1));
			var right = recurse(line.right, Context.NORMAL, 1);

			var oneline = !def$s.length && isOneLiner(right);
			var needBraces = !oneline || !(
				['conditional', 'schemacall', 'var', 'schemaexpr'].includes(line.right._type)
			);
			if (needBraces) oneline = false;

			var braces = !needBraces
				? ['', '']
				: oneline
					? ['{ ', ' }']
					: ['{\n\t', '\n}'];
			
			return `${left} |- ${braces[0]}${
				def$s.map(d => d + '\n\n\t').join('')
			}${right}${braces[1]}`;
		case 'reduction':
			/* export interface ReductionObject {
				_type: 'reduction';
				subject: ExprObject;
				args: Array<ObjectExprObject | null>;
				antecedents: ExprObject[];
				as: ExprObject;
				location: LocationObject;
			} */
			if (context <= Context.REDUCTIONRIGHT)
				return '(' + recurse(line, Context.NORMAL, 0) + ')';
			
			var left = !line.antecedents.length
				? ''
				: line.antecedents.map(left => recurse(left, Context.REDUCTIONLEFT, line.antecedents.length == 1 ? 0 : 1))
					.reduce((l, r) => {
						if (!isOneLiner(r) || (l + r).indexOf(' > ') >= 0) return l + ';\n\t' + r;

						var lastLine = l.lastIndexOf('\n') < 0
							? l
							: l.substring(l.lastIndexOf('\n') + 1);
						
						if (isOneLiner(lastLine + '; ' + r)) return l + '; ' + r;

						return l + ';\n\t' + r;
					});
			var brackets = line.antecedents.length == 1
				? ['', '']
				: isOneLiner(left)
					? ['[', ']']
					: ['[\n\t', '\n]'];
			
			return `${brackets[0]}${left}${brackets[1]} > ${recurse(line.subject, Context.CALLEE, 0)}${
				!line.args
					? ''
					: `(${line.args.map(arg => !arg ? '?' : recurse(arg, Context.NORMAL, 0)).join(', ')})`
			}${line.as ? ' as ' + recurse(line.as, Context.REDUCTIONRIGHT, 0) : ''}`;
		case 'schemacall':
		case 'funcall':
			/* export interface SchemacallObject {
				_type: 'schemacall';
				schema: ExprObject;
				args: ObjectExprObject[];
				location: LocationObject;
			} */

			/* export interface FuncallObject {
				_type: 'funcall';
				schema: ObjectExprObject;
				args: ObjectExprObject[];
				location: LocationObject;
			} */
			var brackets = ['var'].includes(line.schema._type)
				? ['', '']
				: ['(', ')'];

			return `${brackets[0]}${recurse(line.schema, Context.CALLEE, 0)}${brackets[1]}(${
				line.args.map(arg => recurse(arg, Context.NORMAL, 0)).join(', ')
			})`;
		case 'with':
			/* export interface WithObject {
				_type: 'with';
				with: DefvObject;
				def$s: Def$Object[];
				expr: ExprObject;
				location: LocationObject;
			} */
			return `with (${defv(line.with, true)}) {
	${line.def$s.map(def$ => recurse(def$, Context.NORMAL, 1) + '\n\n\t').join('')}${
		recurse(line.expr, Context.NORMAL, 1)
	}
}`;
		case 'var':
			/* export interface VarObject {
				_type: 'var';
				type: '@' | '$' | 'normal';
				name: string;
				location: LocationObject;
			} */
			switch (line.type) {
				case '@': return line.name;
				case '$': return line.name;
				default: return line.name;
			}
		case 'schemaexpr':
		case 'funexpr':
			/* export interface SchemaexprObject {
				_type: 'schemaexpr';
				params: DefvObject[];
				def$s: Def$Object[];
				expr: ExprObject;
				location: LocationObject;
			} */

			/* export interface FunexprObject {
				_type: 'funexpr';
				params: DefvObject[];
				expr: ObjectExprObject;
				location: LocationObject;
			} */
			if (context == Context.CALLEE)
				return recurse(line, Context.NORMAL, 0);
			
			var def$s = line._type == 'funexpr'
				? []
				: line.def$s.map(def$ => recurse(def$, Context.NORMAL, 1));
			var expr = recurse(line.expr, Context.NORMAL, 1);

			var oneline = !def$s.length && isOneLiner(expr);
			var needBraces = !oneline || !(
				['schemacall', 'funcall', 'var', 'schemaexpr', 'funexpr'].includes(line.expr._type)
			);

			var braces = !needBraces
				? ['', '']
				: oneline
					? ['{ ', ' }']
					: ['{\n\t', '\n}'];
			
			return `(${
				line.params.map(param => recurse(param, Context.NORMAL, 0)).join(', ')
			}) => ${braces[0]}${
				def$s.map(d => d + '\n\n\t').join('')
			}${expr}${braces[1]}`;
		case 'type':
			if (line.ftype) {
				/* export interface FtypeObject {
					_type: 'type';
					ftype: true;
					from: TypeObject[];
					to: TypeObject;
					location: LocationObject;
				} */
				var from = line.from.map(f => recurse(f, Context.NORMAL, 0)).join(', ');
				return `[${from} -> ${recurse(line.to, Context.NORMAL, 0)}]`;
			} else  {
				/* export interface StypeObject {
					_type: 'type';
					ftype: false;
					name: string;
					location: LocationObject;
				} */
				return (line as StypeObject).name;
			}
		default:
			throw Error('Unhandled type ' + (line as any)._type);
	}
}