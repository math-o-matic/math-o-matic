(() => {

function getList(value) {
	value = value.toLowerCase();

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
		}).filter(e => e).sort((a, b) => {
			for (var i = 0; i < a.match.length; i++) {
				if (a.match[i] != b.match[i])
					return a.match[i] - b.match[i];
			}

			return a.name.localeCompare(b.name);
		});
}

var listIndex = -1;
var listlen = 10;
var list = null;

autosize($('#console-input'));

$('#console-input').addEventListener('keydown', evt => {
	if (evt.key == 'Escape') {
		destroy();
	}
});

function show() {
	$('#search-dropdown').style.display = 'block';
	$('#search-background').style.display = 'block';

	listIndex = -1;
	[].map.call($$('#search-dropdown ul li'), (e, i) => {
		e.classList.remove('selected');
	});
}

function update(v) {
	listIndex = -1;

	$('#search-dropdown ul').innerHTML =
		!v ? ''
		: (list = getList(v)).slice(0, listlen).map(({name, match}) => {
			return `<li>${name.split('').map((n, i) => {
				if (match.includes(i)) return `<b>${n}</b>`;
				return n;
			}).join('')}</li>`;
		}).join('');

	show();
}

function destroy() {
	$('#search-dropdown ul').innerHTML = '';
	$('#search-dropdown').style.display = 'none';
	$('#search-background').style.display = 'none';
	listIndex = -1;
	list = null;
}

$('#console-input').addEventListener('focus', show);

$('#search-background').addEventListener('click', destroy);

function toggleConsole() {
	var hidden = $('.console-wrap-wrap').style.display == 'none';
	$('.console-wrap-wrap').style.display = hidden ? 'flex' : 'none';

	if (hidden) {
		$('#console-input').focus();
	}
}

$('#button-show-console').addEventListener('click', () => {
	toggleConsole();
});

hotkeys('c', (evt, handler) => {
	evt.preventDefault();
	toggleConsole();
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

$('#console-input').addEventListener('input', evt => {
	if (evt.target.selectionStart != evt.target.selectionEnd) {
		return update('');
	}

	var index = evt.target.selectionStart;

	if (evt.target.value[index] && /[a-z0-9_]/i.test(evt.target.value[index])) {
		return update('');
	}

	var keyword = evt.target.value.substring(0, index).match(/[a-z0-9_]*$/i);

	if (!keyword) return update('');

	update(keyword[0]);
})

$('#console-input').addEventListener('keydown', evt => {
	if (evt.ctrlKey || evt.altKey || evt.key == 'ArrowLeft'
			|| evt.key == 'ArrowRight') {
		update('');
	}
	
	if (evt.key == 'Enter') {
		// submit
		if (evt.shiftKey) {
			evt.preventDefault();

			update('');

			var v = $('#console-input').value;

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
				$('#console-input').value = '';
			}

			return;
		}

		// update autocomplete
		if (list && list.length) {
			var {name, match} = list[Math.max(0, listIndex)];
			destroy();

			if (evt.target.selectionStart != evt.target.selectionEnd) {
				return update('');
			}

			var index = evt.target.selectionStart;

			if (evt.target.value[index] && /[a-z0-9_]/i.test(evt.target.value[index])) {
				return update('');
			}

			var keyword = evt.target.value.substring(0, index).match(/[a-z0-9_]*$/i);

			if (!keyword) return update('');

			evt.target.value = [
				evt.target.value.substring(0, index - keyword[0].length),
				name,
				evt.target.value.substring(index)
			].join('');

			evt.target.selectionStart = evt.target.selectionEnd = index - keyword[0].length + name.length;

			evt.preventDefault();
		}
	}

	// clear console
	if (evt.ctrlKey && evt.key == 'l') {
		evt.preventDefault();
		$('#console-display').innerHTML = '';
		update('');
		htmlify('Console was cleared');
	}

	if (evt.key == 'Tab'
			|| evt.key == 'ArrowDown'
			|| evt.key == 'ArrowUp') {
		evt.preventDefault();

		if (list && list.length) {
			var len = Math.min(list.length, listlen);
			var downward = evt.key == 'ArrowDown'
				|| evt.key == 'Tab' && !evt.shiftKey;

			listIndex = !list
				? -1
				: listIndex >= 0
					? (listIndex + (downward ? 1 : len - 1)) % len
					: downward ? 0 : len - 1;

			[].map.call($$('#search-dropdown ul li'), (e, i) => {
				if (listIndex == i) {
					e.classList.add('selected');
				} else {
					e.classList.remove('selected');
				}
			});
		} else if (evt.key == 'Tab') {
			var selectionStart = evt.target.selectionStart;

			evt.target.value = [
				evt.target.value.substring(0, evt.target.selectionStart),
				'\t',
				evt.target.value.substring(evt.target.selectionEnd)
			].join('');

			evt.target.selectionStart = evt.target.selectionEnd = selectionStart + 1;
		}
	}
});

})();