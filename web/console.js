(() => {

var codemirror = CodeMirror(el => {
	el.id = 'console-input';
	$('.console-wrap').appendChild(el);
}, {
	placeholder: 'Shift + Enter to submit',
	lineNumbers: false,
	lineWrapping: true,
	indentUnit: 4,
	tabSize: 4,
	indentWithTabs: true,
	inputStyle: 'textarea',
	viewportMargin: Infinity
});

codemirror.on('inputRead', function (editor, event) {
	CodeMirror.showHint(codemirror, function () {
		const cursor = codemirror.getCursor();
		var str = codemirror.getRange({line:0,ch:0}, cursor);

		var keyword = str.match(/[a-z0-9_]*$/i);
		if (!keyword) return;
		keyword = keyword[0];

		return {
			list: getList(keyword).map(({name, match}) => ({
				text: name,
				render($el, self, data) {
					var $span = document.createElement('span');
					$span.innerHTML = name.split('').map((e, i) => {
						return match.includes(i) ? `<b>${e}</b>` : e;
					}).join('');
					$el.appendChild($span);
				}
			})),
			from: codemirror.posFromIndex(codemirror.indexFromPos(cursor) - keyword.length),
			to: cursor
		};
	}, {
		completeSingle: false,
		extraKeys: {
			'Shift-Tab': (cm, handle) => {
				handle.moveFocus(-1);
			},
			Tab(cm, handle) {
				handle.moveFocus(1);
			}
		}
	});
});

function htmlify(v, o) {
	var {input, noescape, error} = o || {};

	var $tr = document.createElement('tr');
	$tr.innerHTML =  `<td>${input ? '&gt;' : '&lt;'}</td><td>${noescape ? v : escapeHtml(v)}</td>`;
	if (error) {
		$tr.classList.add('error');
	}

	$('#console-display').appendChild($tr);
	$('#console-display-wrap').scrollTop = $('#console-display-wrap').scrollHeight;
}

$('#console-input').addEventListener('keydown', evt => {
	if (evt.key == 'Enter') {
		// submit
		if (evt.shiftKey) {
			evt.preventDefault();

			var v = codemirror.getValue();

			if (!v.trim()) return;

			htmlify(v.trim(), {input: true});

			if (typeof program == 'undefined') {
				$('#console-input').value = '';
				return htmlify('Error: program is not defined', {error: true});
			}

			try {
				var parsed = evalParser.parse(v);
				htmlify(ktx(program.evaluate(parsed).toTeXString(true, true)), {
					noescape: true
				});
			} catch (e) {
				htmlify(e, {error: true});
			} finally {
				codemirror.setValue('');
			}

			return;
		}
	}

	// clear console
	if (evt.ctrlKey && evt.key == 'l') {
		evt.preventDefault();
		$('#console-display').innerHTML = '';
		htmlify('Console was cleared');
	}
});

var nmax = 10;

function getList(value) {
	value = value.toLowerCase().trim();

	if (!value) return [];

	if (typeof program == 'undefined') return [];

	return Object.keys(program.scope.defMap)
		.concat(Object.keys(program.scope.schemaMap))
		.map(name => {
			var lowername = name.toLowerCase();

			var pname = 0;
			var matchptrs = [];

			for (var pval = 0; pval < value.length; pval++) {
				if (pname >= name.length) return false;
				
				while (lowername[pname] != value[pval]) {
					pname++;
					if (pname >= name.length) return false;
				}

				matchptrs.push(pname);
				pname++;
			}

			return {
				name,
				match: matchptrs
			};
		})
		.filter(e => e)
		.sort((a, b) => {
			for (var i = 0; i < a.match.length; i++) {
				if (a.match[i] != b.match[i])
					return a.match[i] - b.match[i];
			}

			return a.name.localeCompare(b.name);
		})
		.slice(0, nmax);
}

function toggleConsole() {
	var hidden = $('.console-wrap-wrap').style.display == 'none';
	$('.console-wrap-wrap').style.display = hidden ? 'flex' : 'none';

	if (hidden) {
		$('#console-input').focus();
		codemirror.refresh();
	}
}

$('#button-show-console').addEventListener('click', () => {
	toggleConsole();
});

hotkeys('c', (evt, handler) => {
	evt.preventDefault();
	toggleConsole();
});

})();