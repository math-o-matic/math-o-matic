(() => {

CodeMirror.keyMap.sublime['Shift-Ctrl-Enter'] = null;
CodeMirror.keyMap.sublime['Ctrl-L'] = null;

var codemirror = CodeMirror(el => {
	el.id = 'console-input';
	$('.console-wrap').appendChild(el);
}, {
	placeholder: 'Shift + Enter to submit',
	lineNumbers: true,
	lineWrapping: true,
	indentUnit: 4,
	tabSize: 4,
	indentWithTabs: true,
	inputStyle: 'textarea',
	viewportMargin: Infinity,
	keyMap: 'sublime'
});

function hint() {
	if (!Globals.program) return;

	const cursor = codemirror.getCursor();
	var str = codemirror.getRange({line:0,ch:0}, cursor);
	var keywordMatch = str.match(/\$?[a-z0-9_]*$/i);
	if (!keywordMatch) return;
	var keyword = keywordMatch[0];
	var inputBefore = str.substring(0, str.length - keyword.length);

	return {
		list: getSearchResults(keyword, inputBefore, Globals.searchDatabase).map(({name, match}) => ({
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
}

codemirror.on('inputRead', function (editor, event) {
	CodeMirror.showHint(codemirror, hint, {
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

function htmlify(value, options) {
	var {input, noescape, error} = options || {};

	var escapeOrNot = s => noescape ? s : escapeHtml(s);

	var html = '';

	if (value instanceof MathOMatic.InterpolativeError) {
		var {strings, values} = value.interpolativeMessage;
		html += escapeOrNot(strings[0]);

		for (var i = 1; i < strings.length; i++) {
			if (values[i - 1].toTeXString) {
				html += ktx(values[i - 1].toTeXString());
			} else {
				html += escapeOrNot(values[i - 1]);
			}

			html += escapeOrNot(strings[i]);
		}
	} else {
		html = escapeOrNot(value);
	}

	var $tr = document.createElement('tr');
	$tr.innerHTML =  `<td>${input ? '&gt;' : '&lt;'}</td><td>${html}</td>`;
	if (error) {
		$tr.classList.add('error');
	}

	return $tr;
}

function write(value, options) {
	var $tr = htmlify(value, options);

	if ($('#console-display-preview')) {
		$('#console-display').insertBefore($tr, $('#console-display-preview'));
	} else {
		$('#console-display').appendChild($tr);
	}

	$('#console-display-wrap').scrollTop = $('#console-display-wrap').scrollHeight;

	if (timeout) {
		clearTimeout(timeout);
	}

	removePreview();
}

function preview(value, options) {
	var $tr = htmlify(value, options);

	removePreview();

	$tr.id = 'console-display-preview';

	$('#console-display').appendChild($tr);
}

var timeout = null;

function showPreview() {
	if (!Globals.program) {
		return preview('Error: program is not defined', {error: true});
	}

	var v = codemirror.getValue();
	if (!v.trim()) {
		removePreview();
		return;
	}

	try {
		preview(ktx(Globals.program.evaluate(v).toTeXString(null, true)), {
			noescape: true
		});
	} catch (e) {
		preview(e, {error: true});
	}
}

function removePreview() {
	if ($('#console-display-preview')) {
		$('#console-display').removeChild($('#console-display-preview'));
	}
}

$('#console-input').addEventListener('keydown', evt => {
	var v = codemirror.getValue();

	if (timeout) {
		clearTimeout(timeout);
	}

	if (!v.trim()) {
		removePreview();
	} else {
		timeout = setTimeout(() => {
			showPreview();
			timeout = null;
		}, 1000);
	}

	if (evt.key == 'Enter') {
		// submit
		if (evt.shiftKey) {
			evt.preventDefault();

			if (!v.trim()) return;

			write(v.trim(), {input: true});

			if (!Globals.program) {
				return write('Error: program is not defined', {error: true});
			}

			try {
				write(ktx(Globals.program.evaluate(v).toTeXString(null, true)), {
					noescape: true
				});
			} catch (e) {
				console.error(e);
				write(e, {error: true});
			} finally {
				if (!evt.ctrlKey) codemirror.setValue('');
			}

			return;
		}
	}

	// clear console
	if (evt.ctrlKey && evt.key == 'l') {
		evt.preventDefault();
		$('#console-display').innerHTML = '';
		write('Console was cleared');
	}

	if (evt.key == 'F7') {
		evt.preventDefault();
		toggleConsole();
	}
});

function toggleConsole() {
	var hidden = $('.console-wrap-wrap').style.display == 'none';
	$('.console-wrap-wrap').style.display = hidden ? 'flex' : 'none';

	if (hidden) {
		codemirror.focus();
		codemirror.refresh();
	}
}

$('#button-show-console').addEventListener('click', () => {
	toggleConsole();
});

hotkeys('c,f7', (evt, handler) => {
	evt.preventDefault();
	toggleConsole();
});

})();