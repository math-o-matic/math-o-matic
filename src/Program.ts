import Scope from './Scope';
import PegInterface from './PegInterface';
import ExpressionResolver, { Metaexpr } from './ExpressionResolver';
import Reduction from './nodes/Reduction';
import Fun from './nodes/Fun';
import Tee from './nodes/Tee';
import Funcall from './nodes/Funcall';
import Variable from './nodes/Variable';
import $Variable from './nodes/$Variable';
import { EvaluableObject, LineObject } from './PegInterfaceDefinitions';

export default class Program {
	public scope = new Scope(null);
	public readonly parser;
	public readonly scopeMap: Map<string, Scope> = new Map();
	
	constructor(parser) {
		if (!parser) throw Error('no');
		this.parser = parser;
	}

	public async loadModule(filename, loader): Promise<Scope> {
		return this.scope = await this.loadModuleInternal(filename, loader);
	}

	private async loadModuleInternal(filename, loader): Promise<Scope> {
		if (this.scopeMap.has(filename)) {
			return this.scopeMap.get(filename);
		}

		var scope = new Scope(null);

		var code = await loader(filename);
		var parsed = this.parser.parse(code);
		await this.feed(parsed, scope, loader);

		this.scopeMap.set(filename, scope);
		return scope;
	}

	public async feed(lines: LineObject[], scope: Scope=this.scope, loader) {
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			
			switch (line._type) {
				case 'import':
					var scope2 = await this.loadModuleInternal(line.filename, loader);
					scope.importMap.set(line.filename, scope2);
					break;
				case 'typedef':
					var type = PegInterface.type(line, scope);

					if (scope.hasType(type.name)) {
						throw scope.error(`Type ${type.name} has already been declared`);
					}

					scope.addType(type);
					break;
				case 'defv':
					var variable = PegInterface.variable(line, scope);

					if (scope.hasVariable(variable.name)) {
						throw variable.scope.error(`Definition ${variable.name} has already been declared`);
					}

					scope.addVariable(variable);
					break;
				case 'defun':
					var fun = PegInterface.fun(line, scope);

					if (scope.hasVariable(fun.name)) {
						throw fun.scope.error(`Definition ${fun.name} has already been declared`);
					}

					scope.addFun(fun);
					break;
				case 'defschema':
					var schema = PegInterface.schema(line, scope);

					if (scope.hasSchema(schema.name)) {
						throw schema.scope.error(`Schema ${schema.name} has already been declared`);
					}

					scope.addSchema(schema);
					break;
				default:
					// @ts-ignore
					throw Error(`Unknown line type ${line._type}`);
			}
		};
	}

	public evaluate(line: EvaluableObject) {
		switch (line._type) {
			case 'typedef':
				return PegInterface.type(line, this.scope);
			case 'defv':
				return PegInterface.variable(line, this.scope);
			case 'defun':
				return PegInterface.fun(line, this.scope);
			case 'defschema':
			case 'schemaexpr':
				return PegInterface.schema(line, this.scope);
			case 'tee':
				return PegInterface.tee(line, this.scope);
			case 'reduction':
				return PegInterface.reduction(line, this.scope);
			case 'schemacall':
				return PegInterface.schemacall(line, this.scope);
			case 'var':
				return PegInterface.metavar(line, this.scope);
			default:
				// @ts-ignore
				throw Error(`Unknown line type ${line._type}`);
		}
	}

	public getProofExplorer(name: string, ktx) {	
		var DIAMOND = '&#x25C7;',
			DOWN = '&#x25BC;',
			UP = '&#x25B2;';
		
		if (!this.scope.hasSchema(name)) {
			throw Error('wut');
		}
	
		var theexpr = this.scope.getSchema(name);
	
		var ncols = (function recurse(expr: Metaexpr) {
			if (expr instanceof Reduction) {
				return Math.max(
					...expr.leftargs.map(recurse),
					((expr.subject instanceof Fun && expr.subject.name)
						|| (expr.subject instanceof Funcall
								&& 'name' in expr.subject.fun
								&& expr.subject.fun.name)
							? 0 : recurse(expr.subject)),
					1
				);
			} else if (expr instanceof Fun) {
				return Math.max(
					...expr.def$s.map($ => recurse($.expr)),
					recurse(expr.expr)
				) + 1;
			} else if (expr instanceof Tee) {
				return Math.max(
					...expr.left.map(recurse),
					...expr.def$s.map($ => recurse($.expr)),
					recurse(expr.right)
				) + 1;
			} else {
				return 1;
			}
		})(theexpr);

		function getHtmlLine(ctr: string | number, left: any[], h1: string, h2: string | string[], options?) {
			var padding = left.length;

			var {bbb=false, rrb=false} = options || {};
	
			var htmlLeft = left.map((e, i, a) => `<td class="${rrb && i == a.length - 1 ? 'rrb' : 'brb'}">${e.map(f => ktx(f.toTeXStringWithId(true))).join(', ')}</td>`).join('');

			for (var i = 0; i < left.length; i++)
				while(left[i].length) left[i].pop();
	
			return `<tr><th>${ctr}</th>${htmlLeft}<td ${bbb ? 'class="bbb" ' : ''}colspan="${ncols-padding}">${h1}</td>${h2 instanceof Array ? h2.map(e => `<td>${e}</td>`).join('') : `<td colspan="2">${h2}</td>`}</tr>`;
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

			if (expr instanceof Reduction) {
				var leftarglines = [];
				var leftargnums = expr.leftargs.map(l => {
					if (hypnumMap.has(l)) return hypnumMap.get(l);
					if ($Map.has(l)) return $Map.get(l);

					var lines = getTree(l, hypnumMap, $Map);
					leftarglines = leftarglines.concat(lines);
					return lines[lines.length - 1].ctr;
				});
				
				var args = null;
				var subjectlines = [];
				var subjectnum = hypnumMap.get(expr.subject)
					|| $Map.get(expr.subject)
					|| (expr.subject instanceof Funcall && $Map.has(expr.subject.fun)
						? (args = expr.subject.args, $Map.get(expr.subject.fun))
						: false)
					|| ((s => s instanceof Fun && s.name
							|| s instanceof Funcall && 'name' in s.fun && s.fun.name)(expr.subject)
						? expr.subject
						: (subjectlines = getTree(expr.subject, hypnumMap, $Map))[subjectlines.length-1].ctr);

				return [
					...leftarglines,
					...subjectlines,
					{
						_type: 'E',
						ctr: ++ctr,
						subject: subjectnum,
						args,
						leftargs: leftargnums,
						reduced: expr.reduced
					}
				];
			} else if (expr instanceof Funcall) {
				if (hypnumMap.has(expr.fun)) {
					return [{
						_type: 'RC',
						ctr: ++ctr,
						schema: hypnumMap.get(expr.fun),
						args: expr.args,
						expr
					}];
				}

				if ($Map.has(expr.fun)) {
					return [{
						_type: 'RC',
						ctr: ++ctr,
						schema: $Map.get(expr.fun),
						args: expr.args,
						expr
					}];
				}

				// @ts-ignore
				if (expr.fun.isSchema && expr.fun.name) {
					return [{
						_type: 'RCX',
						ctr: ++ctr,
						expr
					}];
				}

				// @ts-ignore
				if (!expr.fun.isSchema) {
					return [{
						_type: 'NP',
						ctr: ++ctr,
						expr
					}];
				}

				var schemalines = getTree(expr.fun, hypnumMap, $Map);

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
			} else if (expr instanceof Variable) {
				return [{
					_type: 'NP',
					ctr: ++ctr,
					expr
				}];
			} else if (expr instanceof Fun) {
				if (expr.isSchema && expr.name && expr != theexpr) {
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

				var start = ctr + 1;

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
					ctr: [start ,ctr]
				}];
			} else if (expr instanceof Tee) {
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
			} else if (expr instanceof $Variable) {
				if (!$Map.has(expr)) {
					throw Error(`${expr.name} is not defined`);
				}

				return [{
					_type: 'R',
					ctr: ++ctr,
					num: $Map.get(expr),
					expr: expr.expr
				}];
			} else {
				console.log('Unknown metaexpr', expr);
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
								'', emptyleft, '', '', {bbb: true, rrb: true}
							);
						} else {
							ret += line.leftlines.map((line, i, a) => {
								return getHtmlLine(
									line.ctr,
									newleft,
									exprToHtml(line.expr, true),
									'assumption',
									{bbb: i == a.length - 1, rrb: true}
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
							[DOWN, `${exprToHtml(line.subject)}${line.args ? ' (' + line.args.map(a => exprToHtml(a)).join(', ') + ')' : ''} [${line.leftargs.map(a => exprToHtml(a)).join(', ')}]`]
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