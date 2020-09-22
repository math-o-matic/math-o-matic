import Scope from './Scope';
import PegInterface from './PegInterface';
import ExpressionResolver from './ExpressionResolver';
import Schema from './nodes/Schema';
import Typevar from './nodes/Typevar';
import Tee from './nodes/Tee';
import Schemacall from './nodes/Schemacall';
import Type from './nodes/Type';

export default class Program {
	public scope = new Scope(null);
	
	constructor() {}

	public feed(lines) {
		lines.forEach(line => {
			switch (line._type) {
				case 'typedef':
					var type = PegInterface.type(line, this.scope);

					if (this.scope.hasType(type.name)) {
						throw type.scope.error(`Type ${type.name} has already been declared`);
					}

					this.scope.addType(type);
					break;
				case 'defv':
					var typevar = PegInterface.typevar(line, this.scope);

					if (this.scope.hasTypevar(typevar.name)) {
						throw typevar.scope.error(`Definition ${typevar.name} has already been declared`);
					}

					this.scope.addTypevar(typevar);
					break;
				case 'defun':
					var fun = PegInterface.fun(line, this.scope);

					if (this.scope.hasTypevar(fun.name)) {
						throw fun.scope.error(`Definition ${fun.name} has already been declared`);
					}

					this.scope.addFun(fun);
					break;
				case 'defruleset':
					var ruleset = PegInterface.ruleset(line, this.scope, this.nativeMap);

					if (this.scope.hasRuleset(ruleset.name)) {
						throw ruleset.scope.error(`Ruleset ${ruleset.name} has already been declared`);
					}

					this.scope.addRuleset(ruleset);
					break;
				case 'defschema':
					var schema = PegInterface.schema(line, this.scope, this.nativeMap);

					if (this.scope.hasSchema(schema.name)) {
						throw schema.scope.error(`Schema ${schema.name} has already been declared`);
					}

					this.scope.addSchema(schema);
					break;
				default:
					throw Error(`Unknown line type ${line._type}`);
			}
		});
	}

	public evaluate(line) {
		switch (line._type) {
			case 'typedef':
			case 'defv':
			case 'defun':
			case 'defruleset':
			case 'defschema':
			case 'tee':
			case 'reduction':
			case 'schemacall':
			case 'var':
			case 'schemaexpr':
				return PegInterface[({
					typedef: 'type',
					defv: 'typevar',
					defun: 'fun',
					defruleset: 'ruleset',
					defschema: 'schema',
					tee: 'tee',
					reduction: 'reduction',
					schemacall: 'schemacall',
					var: 'metavar',
					schemaexpr: 'schemaexpr'
				})[line._type]](line, this.scope);
			default:
				throw Error(`Unknown line type ${line._type}`);
		}
	}

	public nativeMap = {
		ruleset: {
			tt: {
				get: (name: string, scope: Scope): Schema => {
					if (typeof name != 'string')
						throw Error('Assertion failed');
	
					var vars = ['p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
					var nullary = ['T', 'F'].concat(vars);
					var unary = ['N'];
					var binary = ['A', 'O', 'I', 'E'];
	
					var arityMap = {};
					nullary.forEach(e => arityMap[e] = 0);
					unary.forEach(e => arityMap[e] = 1);
					binary.forEach(e => arityMap[e] = 2);
	
					var usedVars = Array(vars.length).fill(false);
	
					// 1: 파싱 하기
					var stack = [];
	
					function lastIsFull() {
						if (!stack.length) return true;
						return arityMap[stack[stack.length - 1][0]] == stack[stack.length - 1].length - 1;
					}
	
					function push(token) {
						if (arityMap[token] == 0) {
							if (vars.includes(token))
								usedVars[vars.indexOf(token)] = true;
	
							if (lastIsFull()) {
								stack.push(token);
							} else {
								stack[stack.length - 1].push(token);
	
								while (stack.length > 1 && lastIsFull()
										&& (stack[stack.length - 2] instanceof Array)) {
									var p = stack.pop();
									stack[stack.length - 1].push(p);
								}
							}
						} else {
							stack.push([token]);
						}
					}
	
					for (var i = 0; i < name.length; i++) {
						if (typeof arityMap[name[i]] != 'number')
							throw Error(`Unexpected character ${name[i]}`);
	
						push(name[i]);
					}
	
					if (stack.length != 1)
						throw Error('Parse failed');
	
					if (!lastIsFull())
						throw Error('Parse failed');
	
					// @ts-ignore
					usedVars = usedVars.map((e, i) => e && i).filter(e => e !== false);
	
					var parsed = stack[0];
	
					// 2: 진리표 확인
					var collen = 2 ** usedVars.length;
	
					var functionMap = {
						N: p => !p,
						A: (p, q) => p && q,
						O: (p, q) => p || q,
						I: (p, q) => !p || q,
						E: (p, q) => p == q
					};
	
					var varTable = {};
	
					for (var i = 0; i < usedVars.length; i++) {
						varTable[vars[usedVars[i]]] = Array(collen).fill(null).map((_, j) => {
							return !((j >> (usedVars.length - i - 1)) & 1);
						});
					}
	
					var constTable = {
						T: Array(collen).fill(true),
						F: Array(collen).fill(false)
					};
	
					function getColumn(t) {
						if (t instanceof Array) {
							var columns = t.slice(1).map(getColumn);
	
							var column = Array(collen);
	
							for (var i = 0; i < collen; i++) {
								column[i] = functionMap[t[0]](...columns.map(col => col[i]));
							}
	
							return column;
						}
	
						if (['T', 'F'].includes(t)) return constTable[t];
						return varTable[t];
					}
	
					if (!getColumn(parsed).every(e => e))
						throw Error('Validation failed');
	
					// 3: 노드 트리 만들기
					if (!scope.baseType)
						throw Error(`Base type not found`);
	
					var base = scope.baseType;
	
					var typevars = Array(usedVars.length).fill(null).map((_, i) => {
						return new Typevar({
							type: base,
							name: vars[usedVars[i]]
						});
					});
	
					var typevarMap = {
						'T': 'T',
						'F': 'F',
						'N': 'N',
						'A': 'A',
						'O': 'O',
						'I': 'I',
						'E': 'E'
					};
	
					Object.keys(typevarMap).forEach(k => {
						var v = typevarMap[k];
	
						if (!scope.root.hasTypevar(v))
							throw Error(`Typevar ${v} not found`);
						typevarMap[k] = scope.root.getTypevar(v);
					});
	
					function recurse(t) {
						if (t instanceof Array) {
							return new Schemacall({
								schema: recurse(t[0]),
								args: t.slice(1).map(recurse)
							});
						}
	
						if (vars.includes(t)) return typevars[vars.indexOf(t)];
						return typevarMap[t];
					}
	
					var funcall = recurse(parsed);
	
					var tee = new Tee({
						left: [],
						right: funcall
					});
	
					var schema = new Schema({
						shouldValidate: true,
						axiomatic: true,
						name: 'tt.' + name,
						params: typevars,
						expr: tee
					});
	
					return schema;
				}
			}
		},
		schema: {
			cut: {
				get: (rules, scope: Scope) => {
					return ExpressionResolver.chain(rules.map(ExpressionResolver.expandMeta));
				}
			},
			mpu: {
				get: (rules, scope: Scope) => {
					if (rules.length != 1) throw Error('wut');
					var rule = rules[0];
	
					if (!scope.baseType)
						throw Error(`Base type not found`);
	
					var base = scope.baseType;
	
					var tee = ExpressionResolver.expandMeta(rule) as Tee;
	
					var right = ExpressionResolver.expandMetaAndFuncalls(tee.right);
	
					if (tee._type != 'tee')
						throw Error('wut');
	
					if (!scope.hasTypevar('I'))
						throw Error(`Typevar I not found`);
	
					var I = scope.getTypevar('I');
	
					if (!I.type.equals(new Type({
						functional: true,
						from: [base, base],
						to: base
					})))
						throw Error(`Wrong type for I`);
	
					if (right._type != 'schemacall' || right.schema != I) {
						console.log(right);
						throw Error('wut');
					}
	
					return new Tee({
						left: tee.left.concat([right.args[0]]),
						right: right.args[1]
					});
				}
			}
		}
	};

	public getProofExplorer(name: string, ktx) {
		var ctr = 0;
	
		var DIAMOND = '&#x25C7;',
			DOWN = '&#x25BC;',
			UP = '&#x25B2;';
		
		if (!this.scope.schemaMap.has(name)) {
			throw Error('wut');
		}
	
		var expr = this.scope.schemaMap.get(name).expr;
	
		var ncols = (function recurse(expr) {
			switch (expr._type) {
				case 'reduction':
					return Math.max(
						...expr.leftargs.map(recurse),
						((expr.subject._type == 'schema' && expr.subject.name)
							|| (expr.subject._type == 'schemacall' && expr.subject.schema.name)
								? 0 : recurse(expr.subject)),
						1
					);
				case 'schema':
					return recurse(expr.expr) + 1;
				case 'tee':
					return Math.max(
						...expr.left.map(recurse),
						recurse(expr.right)
					) + 1;
				case 'schemacall':
				default:
					return 1;
			}
		})(expr);
	
		var html = '<table class="explorer">';
		html += `<tr><th>#</th><th colspan="${ncols}">expr</th><th colspan="2">rule</th></tr>`;
	
		function getHtml(left, h1, h2, bbb?: boolean, noctr?: boolean) {
			var padding = left.length;
	
			var htmlLeft = left.map(e => `<td class="brb">${e.map(f => ktx(f.toTeXString(true))).join(', ')}</td>`).join('');
	
			return `<tr><th>${noctr ? '' : ++ctr}</th>${htmlLeft}<td ${bbb ? 'class="bbb"' : ''} colspan="${ncols-padding}">${h1}</td>${h2}</tr>`;
		}
	
		function getHypNo(hyps, expr) {
			for (var i = 0; i < hyps.length; i++) {
				var [hyp, lineno] = hyps[i];
	
				if (ExpressionResolver.equals(hyp, expr)) {
					return lineno;
				}
			}
	
			return false;
		}
	
		html += (function recurse(expr, left, hyps) {
			var hypno = getHypNo(hyps, expr);
	
			if (hypno) {
				return getHtml(
					left,
					ktx(expr.toTeXString(true)),
					`<td>${DIAMOND}</td><td>[<b>${hypno}</b>]</td>`
				);
			}
	
			switch (expr._type) {
				case 'reduction':
					var leftPrinted = false;
	
					var leftargs = expr.leftargs.map(leftarg => {
						var hypno = getHypNo(hyps, leftarg);
	
						if (hypno) {
							return [false, hypno];
						}
	
						if (!leftPrinted) {
							leftPrinted = true;
						} else {
							left = Array(left.length).fill([]);
						}
	
						return [
							recurse(
								leftarg,
								left,
								hyps
							),
							ctr
						];
					});
	
					if (leftPrinted) {
						left = Array(left.length).fill([]);
					}
	
					if ((expr.subject._type == 'schema' && expr.subject.name)
							|| (expr.subject._type == 'schemacall' && expr.subject.schema.name)) {
						return [
							leftargs.map(e => e[0]).filter(e => e).join(''),
							getHtml(
								left,
								ktx(expr.reduced.toTeXString(true)),
								`<td>${DOWN}</td><td>${ktx(expr.subject.toTeXString(true))} [${leftargs.map(e => `<b>${e[1]}</b>`).join(', ')}]</td>`
							)
						].join('');
					}
	
					var subject = (() => {
						var hypno = getHypNo(hyps, expr.subject);
	
						if (hypno) {
							return [false, hypno];
						}
	
						if (!leftPrinted) {
							leftPrinted = true;
						} else {
							left = Array(left.length).fill([]);
						}
	
						return [
							recurse(
								expr.subject,
								left,
								hyps
							),
							ctr
						];
					})();
	
					if (leftPrinted) {
						left = Array(left.length).fill([]);
					}
	
					return [
						leftargs.map(e => e[0]).filter(e => e).join(''),
						subject[0] || '',
						getHtml(
							left,
							ktx(expr.reduced.toTeXString(true)),
							`<td>${DOWN}</td><td><b>${subject[1]}</b> [${leftargs.map(e => `<b>${e[1]}</b>`).join(', ')}]</td>`
						)
					].join('');
				case 'schemacall':
					var callee = expr.schema;
					
					var expanded = ExpressionResolver.expandMetaAndFuncalls(expr);
	
					if (callee.shouldValidate && callee.name) {
						return getHtml(
							left,
							ktx(expanded.toTeXString(true)),
							`<td>${DIAMOND}</td><td>${ktx(expr.toTeXString(true))}</td>`
						);
					}
	
					var hypno = getHypNo(hyps, callee);
	
					if (hypno) {
						return getHtml(
							left,
							ktx(expanded.toTeXString(true)),
							`<td>${DIAMOND}</td><td><b>${hypno}</b> (${expr.args.map(arg => ktx(arg.toTeXString(true))).join(', ')})</td>`
						);
					}
	
					return getHtml(
						left,
						ktx(expanded.toTeXString(true)),
						'<td colspan="2"><b class="red">not proved</b></td>'
					);
				case 'typevar':
					var hypno = getHypNo(hyps, expr);
	
					if (hypno) {
						return getHtml(
							left,
							ktx(expr.toTeXString(true)),
							`<td>${DIAMOND}</td><td><b>${hypno}</b></td>`
						);
					}
	
					return getHtml(
						left,
						ktx(expr.toTeXString(true)),
						'<td colspan="2"><b class="red">not proved</b></td>'
					);
				case 'schema':
					if (expr.name) {
						return getHtml(
							left,
							ktx(expr.toTeXString(true, true)),
							`<td>${DIAMOND}</td><td>${ktx(expr.toTeXString(true))}</td>`
						);
					}
	
					return recurse(
						expr.expr,
						left.concat([expr.params]),
						hyps
					);
				case 'tee':
					var start = ctr + 1;
					var arr = [
						...(
							expr.left.length
								? expr.left.map((e, i, a) => getHtml(
									(i == 0 ? left.concat([[]]) : Array(left.length + 1).fill([])),
									ktx(e.toTeXString(true)),
									'<td colspan="2">assumption</td>',
									i == a.length - 1
								))
								: [getHtml(
									Array(left.length + 1).fill([]),
									'',
									'<td colspan="2"></td>',
									true,
									true
								)]
						),
						recurse(
							expr.right,
							(expr.left.length == 0 ? left.concat([[]]) : Array(left.length + 1).fill([])),
							hyps.concat(expr.left.map((e, i) => [e, start + i]))
						)
					];
					var end = ctr;
	
					return [
						...arr,
						getHtml(
							Array(left.length).fill([]),
							ktx(expr.toTeXString(true)),
							`<td>${UP}</td><td>[<b>${start}</b>&ndash;<b>${end}</b>]</td>`
						)
					].join('');
				default:
					console.error(expr.error(`Unknown type ${expr._type}`));
	
					return getHtml(
						left,
						ktx(expr.toTeXString(true)),
						'<td colspan="2">???</td>'
					);
			}
		})(expr, [], []);
	
		html += '</table>';
	
		return html;
	}
}