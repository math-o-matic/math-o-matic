import Calculus from "./Calculus";
import Expr from "./expr/Expr";
import Precedence from "./Precedence";
import Variable from "./expr/Variable";
import { ProofType } from "./ProofType";
import Scope from "./scope/Scope";
import SchemaDecoration from "./decoration/SchemaDecoration";
import Parameter from "./expr/Parameter";

export default class ProofExplorer {
	public static get(scope: Scope, name: string, ktx: (s: string) => string, yamd: {render: (s: string) => string}): string {
		var REPEAT = '<b>R</b>',
			TE = '<b>⊢E</b>',
			SE = '<b>↦E</b>';
		
		if (!scope.hasVariable(name)) {
			throw Error('wut');
		}
	
		var expr = scope.getVariable(name);

		if (!(expr instanceof Variable && expr.decoration instanceof SchemaDecoration)) {
			throw Error('wut');
		}

		function getHtmlLine(ctr: string | number, left: Parameter[][], h1: string, h2: string | string[], options?: {bbb: boolean, rrb: boolean}) {
			var padding = left.length;

			var {bbb=false, rrb=false} = options || {};
	
			var htmlLeft = left.map((e, i, a) => `<td class="${rrb && i == a.length - 1 ? 'rrb' : 'brb'}">${e.map(f => ktx(f.toTeXStringWithId(Precedence.INFINITY))).join(', ')}</td>`).join('');

			for (var i = 0; i < left.length; i++)
				while(left[i].length) left[i].pop();
	
			return `<tr><th>${ctr}</th>${htmlLeft}<td ${bbb ? 'class="bbb" ' : ''}colspan="${ncols-padding}">${h1}</td>${h2 instanceof Array ? h2.map((e, i) => `<td${i == 0 ? ' style="text-align:center"' : ''}>${e}</td>`).join('') : `<td colspan="2">${h2}</td>`}</tr>`;
		}

		function exprToHtml(expr: number | [number, number] | Expr, expand?: boolean): string {
			if (typeof expr == 'number') return `<b>${expr}</b>`;
			if (expr instanceof Array) return `<b>${expr[0]}&ndash;${expr[1]}</b>`;
			if (expand) return ktx(Calculus.expand(expr).toTeXString(Precedence.INFINITY, true));
			
			return ktx(expr.toTeXString(Precedence.INFINITY, true));
		}

		var tree = Calculus.getProof(expr);

		var innertree: ProofType[] = (tree[0] as any).$lines.concat((tree[0] as any).lines);

		var ncols = (function recurse(tree: ProofType[]): number {
			return Math.max(...tree.map(t => {
				switch (t._type) {
					case 'V':
						return Math.max(
							recurse(t.$lines),
							recurse(t.lines)
						) + 1;
					case 'T':
						return Math.max(
							recurse(t.leftlines),
							recurse(t.rightlines)
						) + 1;
					default:
						return 1;
				}
			}));
		})(innertree);

		var html = '<table class="explorer">';
		html += `<tr><th>#</th><th colspan="${ncols}">expression</th><th colspan="2">rule</th></tr>`;
		
		html += (function tree2html(lines: ProofType[], left: Parameter[][]): string {
			return lines.map(line => {
				switch (line._type) {
					case 'V':
						// getHtmlLine 함수가 이 배열을 조작하기 때문에
						// shallow copy 해야 한다.
						var params = line.params.slice();
						return tree2html(line.$lines, left.concat([params]))
							+ tree2html(line.lines, left.concat([params]));
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
							line.rightlines,
							newleft
						);

						return ret;
					case 'H':
						throw Error('no');
					case 'R':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							[REPEAT, exprToHtml(line.num)]
						);
					case 'RS':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							[REPEAT, exprToHtml(line.expr)]
						);
					case 'RC':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							[SE, exprToHtml(line.expr)]
						);
					case 'SE':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							[SE, `${exprToHtml(line.schema)} (${line.args.map(a => exprToHtml(a)).join(', ')})`]
						);
					case 'TE':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.reduced, true),
							[TE, `${exprToHtml(line.subject)}${line.args ? ' (' + line.args.map(a => exprToHtml(a)).join(', ') + ')' : ''} [${line.antecedents.map(a => exprToHtml(a)).join(', ')}]`]
						);
					case 'NP':
						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr, true),
							'<b class="red">not proved</b>'
						);
					case 'def':
						return getHtmlLine(
							line.ctr,
							left,
							line.var.decoration.doc ? `<p>${exprToHtml(line.var)}</p>${yamd.render(line.var.decoration.doc)}` : exprToHtml(line.var),
							'definition'
						);
					case 'bydef':
						var of_: Variable[] = [];
						line.of.forEach(e => {
							if (!of_.includes(e)) of_.push(e);
						});

						return getHtmlLine(
							line.ctr,
							left,
							exprToHtml(line.expr),
							`by definition of ${of_.map(v => {
								return exprToHtml(v);
							}).join(', ')} [${exprToHtml(line.ref)}]`
						);
					default:
						throw Error(`Unknown type ${(line as any)._type}`);
				}
			}).join('');
		})(innertree, []);
		
		html += '</table>';
	
		return html;
	}
}