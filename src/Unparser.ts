import { Def$Object, DefvObject, ObjectExprObject, StartObject, ExprObject, TypeObject, LineObject, DefpackageObject, ImportObject, DefsystemObject } from "./PegInterfaceDefinitions";

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
		// .replace(/\n/g, '\n' + '\t'.repeat(indent))
		.replace(/(?<=\n)\s+(?=\n)/g, '');
}

function recurseInternal(
		line: DefpackageObject | ImportObject | DefsystemObject | LineObject | Def$Object | ExprObject | ObjectExprObject | TypeObject,
		context: Context): string {
	
	function defv(line: DefvObject, param: boolean) {
		var s = param ? ' ' : '\n';
		return `${
	line.doc ? `"${line.doc}"` + s : ''
}${
	line.tex ? `$${line.tex}$` + s : ''
}${line.sealed || param ? '' : 'unsealed '}${recurse(line.type, Context.NORMAL, 0)} ${line.name}${
	line.selector ? ': @' + line.selector : ''
}${
	line.expr ? ' = ' + recurse(line.expr, Context.NORMAL, 0) : ''
}${param ? '' : ';'}`;
	}

	switch (line._type) {
		case 'defpackage':
			return `package ${line.name};`;
		case 'defsystem':
			return `system ${line.name}${
	line.extends_.length ? ` extends ${line.extends_.join(', ')}` : ''
} {
	${line.lines.map(line => recurse(line, Context.NORMAL, 1)).join('\n\n\t')}
}`;
			break;
		case 'defschema':
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
			return `${
	line.doc ? `"${line.doc}"\n` : ''
}${typeof line.tex_attributes.precedence == 'number' ? `[precedence=${line.tex_attributes.precedence}]\n` : ''}${
	line.tex ? `$${line.tex}$\n` : ''
}${line.sealed ? '' : 'unsealed '}${recurse(line.rettype, Context.NORMAL, 0)} ${line.name}(${
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
			return `import ${line.name};`;
		case 'typedef':
			return `${
	line.doc ? `"${line.doc}"\n` : ''
}type ${line.name}${
	line.expr ? ' = ' + recurse(line.expr, Context.NORMAL, 0) : ''
};`;
		case 'def$':
			return `${line.name} = ${recurse(line.expr, Context.NORMAL, 0)};`;
		case 'conditional':
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
			var brackets = ['var'].includes(line.schema._type)
				? ['', '']
				: ['(', ')'];

			return `${brackets[0]}${recurse(line.schema, Context.CALLEE, 0)}${brackets[1]}(${
				line.args.map(arg => recurse(arg, Context.NORMAL, 0)).join(', ')
			})`;
		case 'with':
			return `with (${defv(line.with, true)}) {
	${line.def$s.map(def$ => recurse(def$, Context.NORMAL, 1) + '\n\n\t').join('')}${
		recurse(line.expr, Context.NORMAL, 1)
	}
}`;
		case 'var':
			switch (line.type) {
				case '@': return line.name;
				case '$': return line.name;
				default: return line.name;
			}
		case 'schemaexpr':
		case 'funexpr':
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
				var from = line.from.map(f => recurse(f, Context.NORMAL, 0)).join(', ');
				return `[${from} -> ${recurse(line.to, Context.NORMAL, 0)}]`;
			} else  {
				return line.name;
			}
		default:
			throw Error('Unhandled type ' + (line as any)._type);
	}
}