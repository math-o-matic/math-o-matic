function getProofExplorer(name) {
	if (!program) return;

	var ctr = 0;

	var DIAMOND = '&#x25C7;',
		DOWN = '&#x25BC;',
		UP = '&#x25B2;';

	var expr = program.scope.schemaMap[name].expr;

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

	function getHtml(left, h1, h2, bbb, noctr) {
		var padding = left.length;

		var htmlLeft = left.map(e => `<td class="brb">${e.map(f => ktx(f.toTeXString(true))).join(', ')}</td>`).join('');

		return `<tr><th>${noctr ? '' : ++ctr}</th>${htmlLeft}<td ${bbb ? 'class="bbb"' : ''} colspan="${ncols-padding}">${h1}</td>${h2}</tr>`;
	}

	function getHypNo(hyps, expr) {
		for (var i = 0; i < hyps.length; i++) {
			var [hyp, lineno] = hyps[i];

			if (program.ExpressionResolver.equals(hyp, expr)) {
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
				
				var expanded = program.ExpressionResolver.expandMetaAndFuncalls(expr);

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