import Scope from './Scope';
import PegInterface from './PegInterface';
import ExpressionResolver, { Metaexpr } from './ExpressionResolver';
import Schema from './nodes/Schema';
import Typevar from './nodes/Typevar';
import Tee from './nodes/Tee';
import Schemacall from './nodes/Schemacall';
import Type from './nodes/Type';
import $var from './nodes/$var';

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
							isParam: true,
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
		var DIAMOND = '&#x25C7;',
			DOWN = '&#x25BC;',
			UP = '&#x25B2;';
		
		if (!this.scope.schemaMap.has(name)) {
			throw Error('wut');
		}
	
		var theexpr = this.scope.schemaMap.get(name);
	
		var ncols = (function recurse(expr: any) {
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
						...expr.def$s.map($ => recurse($.expr)),
						recurse(expr.right)
					) + 1;
				case 'schemacall':
				default:
					return 1;
			}
		})(theexpr);

		function getHtmlLine(ctr: string | number, left: any[], h1: string, h2: string | string[], bbb?: boolean) {
			var padding = left.length;
	
			var htmlLeft = left.map(e => `<td class="brb">${e.map(f => ktx(f.toTeXString(true))).join(', ')}</td>`).join('');

			for (var i = 0; i < left.length; i++)
				while(left[i].length) left[i].pop();
	
			return `<tr><th>${ctr}</th>${htmlLeft}<td ${bbb ? 'class="bbb"' : ''} colspan="${ncols-padding}">${h1}</td>${h2 instanceof Array ? h2.map(e => `<td>${e}</td>`).join('') : `<td colspan="2">${h2}</td>`}</tr>`;
		}

		function exprToHtml(expr, expand?) {
			if (typeof expr == 'number') return `<b>${expr}</b>`;
			if (expr instanceof Array) return `<b>${expr[0]}&ndash;${expr[1]}</b>`;
			if (expand) return ktx(ExpressionResolver.expandMetaAndFuncalls(expr).toTeXString(true));
			
			return ktx(expr.toTeXString(true));
		}

		var ctr = 0;

		var tree = (function getTree(
				expr: Metaexpr,
				hypnumMap: Map<Metaexpr, number>,
				$Map: Map<Metaexpr, number>) {
			
			if (hypnumMap.has(expr)) {
				return [{
					_type: 'R',
					ctr: ++ctr,
					num: hypnumMap.get(expr),
					expr
				}];
			}

			if ($Map.has(expr)) {
				return [{
					_type: 'R',
					ctr: ++ctr,
					num: $Map.get(expr),
					expr
				}];
			}

			switch (expr._type) {
				case 'reduction':
					var leftarglines = [];
					var leftargnums = expr.leftargs.map(l => {
						if (hypnumMap.has(l)) return hypnumMap.get(l);
						if ($Map.has(l)) return $Map.get(l);

						var lines = getTree(l, hypnumMap, $Map);
						leftarglines = leftarglines.concat(lines);
						return lines[lines.length - 1].ctr;
					});
					
					var subjectlines = [];
					var subjectnum = hypnumMap.get(expr.subject)
						|| $Map.get(expr.subject)
						|| ((s => s._type == 'schema' && s.name
								|| s._type == 'schemacall' && s.schema.name)(expr.subject)
							? expr.subject
							: (subjectlines = getTree(expr.subject, hypnumMap, $Map))[subjectlines.length-1].ctr);

					return [
						...leftarglines,
						...subjectlines,
						{
							_type: 'E',
							ctr: ++ctr,
							subject: subjectnum,
							leftargs: leftargnums,
							reduced: expr.reduced
						}
					];
				case 'schemacall':
					if (hypnumMap.has(expr.schema)) {
						return [{
							_type: 'RC',
							ctr: ++ctr,
							schema: hypnumMap.get(expr.schema),
							args: expr.args,
							expr
						}];
					}

					if ($Map.has(expr.schema)) {
						return [{
							_type: 'RC',
							ctr: ++ctr,
							schema: $Map.get(expr.schema),
							args: expr.args,
							expr
						}];
					}

					if (expr.schema.shouldValidate && expr.schema.name) {
						return [{
							_type: 'RCX',
							ctr: ++ctr,
							expr
						}];
					}

					if (!expr.schema.shouldValidate) {
						return [{
							_type: 'NP',
							ctr: ++ctr,
							expr
						}];
					}

					var schemalines = getTree(expr.schema, hypnumMap, $Map);

					return [
						...schemalines,
						{
							_type: 'RC',
							ctr: ++ctr,
							schema: schemalines[schemalines.length - 1].ctr,
							args: expr.args,
							expr
						}
					];
				case 'typevar':
					return [{
						_type: 'NP',
						ctr: ++ctr,
						expr
					}];
				case 'schema':
					if (expr.shouldValidate && expr.name && expr != theexpr) {
						return [{
							_type: 'RS',
							ctr: ++ctr,
							expr
						}];
					}

					if (!expr.expr) {
						return [{
							_type: 'NP',
							ctr: ++ctr,
							expr
						}];
					}

					$Map = new Map($Map);

					var $lines = [];
					
					expr.def$s.forEach($ => {
						var lines = getTree($.expr, hypnumMap, $Map);
						$lines = $lines.concat(lines);

						var $num = lines[lines.length - 1].ctr;
						$Map.set($, $num);
					});

					return [{
						_type: 'V',
						$lines,
						lines: getTree(expr.expr, hypnumMap, $Map),
						// getHtmlLine 함수가 이 배열을 조작하기 때문에
						// shallow copy 해야 한다.
						params: expr.params.slice(),
						ctr
					}];
				case 'tee':
					hypnumMap = new Map(hypnumMap);
					var leftlines = [];

					var start = ctr + 1;

					expr.left.forEach(l => {
						hypnumMap.set(l, ++ctr);
						leftlines.push({
							_type: 'H',
							ctr,
							expr: l
						});
					});

					$Map = new Map($Map);

					var $lines = [];
					expr.def$s.forEach($ => {
						var lines = getTree($.expr, hypnumMap, $Map);
						$lines = $lines.concat(lines);

						var $num = lines[lines.length - 1].ctr;
						$Map.set($, $num);
					});

					return [{
						_type: 'T',
						leftlines,
						$lines,
						rightlines: getTree(expr.right, hypnumMap, $Map),
						ctr: [start, ctr]
					}];
				case '$var':
					if (!$Map.has(expr)) {
						throw Error(`${expr.name} is not defined`);
					}

					return [{
						_type: 'R',
						ctr: ++ctr,
						num: $Map.get(expr),
						expr: expr.expr
					}];
				default:
					// @ts-ignore
					console.error(expr.error(`Unknown type ${expr._type}`));
					return [{
						_type: '?',
						ctr: ++ctr,
						expr
					}];
			}
		})(theexpr, new Map(), new Map());

		var html = '<table class="explorer">';
		html += `<tr><th>#</th><th colspan="${ncols}">expr</th><th colspan="2">rule</th></tr>`;
		
		html += (function tree2html(lines, left) {
			return lines.map(line => {
				switch (line._type) {
					case 'V':
						return tree2html(line.$lines, left.concat([line.params]))
							+ tree2html(line.lines, left.concat([line.params]));
					case 'T':
						var newleft = left.concat([[]]);

						var ret = '';

						if (line.leftlines.length == 0) {
							var emptyleft = Array(left.length + 1).fill([]);

							ret += getHtmlLine(
								'', emptyleft, '', '', true
							);
						} else {
							ret += line.leftlines.map((line, i, a) => {
								return getHtmlLine(
									line.ctr,
									newleft,
									exprToHtml(line.expr, true),
									'assumption',
									i == a.length - 1
								);
							}).join('');
						}

						ret += tree2html(
							line.$lines,
							newleft
						);

						ret += tree2html(
							line.rightlines,
							newleft
						);

						return ret;
					case '?':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							'???'
						);
					case 'H':
						throw Error('no');
					case 'R':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							[DIAMOND, exprToHtml(line.num)]
						);
					case 'RS':
					case 'RCX':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							[DIAMOND, exprToHtml(line.expr)]
						);
					case 'RC':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							[DIAMOND, `${exprToHtml(line.schema)} (${line.args.map(a => exprToHtml(a)).join(', ')})`]
						);
					case 'E':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.reduced, true),
							[DOWN, `${exprToHtml(line.subject)} [${line.leftargs.map(a => exprToHtml(a)).join(', ')}]`]
						);
					case 'NP':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							'<b class="red">not proved</b>'
						);
					default:
						return getHtmlLine(
							line.ctr,
							left,
							`Unknown type ${line._type}`,
							''
						);
				}
			}).join('');
		})(tree[0].$lines.concat(tree[0].lines), []);
		
		html += '</table>';
	
		return html;
	}
}