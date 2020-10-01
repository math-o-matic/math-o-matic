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
				case 'defschema':
					var schema = PegInterface.schema(line, this.scope);

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
					return Math.max(
						...expr.def$s.map($ => recurse($.expr)),
						recurse(expr.expr)
					 ) + 1;
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
					
					var args = null;
					var subjectlines = [];
					var subjectnum = hypnumMap.get(expr.subject)
						|| $Map.get(expr.subject)
						|| (expr.subject._type == 'schemacall' && $Map.has(expr.subject.schema)
							? (args = expr.subject.args, $Map.get(expr.subject.schema))
							: false)
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
							args,
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