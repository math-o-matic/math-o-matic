(() => {
	hotkeys('f', (evt, handler) => {
		evt.preventDefault();
		$('#search').focus();
	});

	function getList(value) {
		value = value.toLowerCase();

		if (typeof program == 'undefined') return [];

		return Object.keys(program.scope.defMap).map(n => [n, 'def'])
			.concat(Object.keys(program.scope.schemaMap).map(n => [n, 'schema']))
			.map(([name, type]) => {
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

				return {name, type, match: matchptrs};
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

	$('#search').addEventListener('keydown', evt => {
		if (evt.key == 'Tab'
				|| evt.key == 'ArrowDown'
				|| evt.key == 'ArrowUp') {
			evt.preventDefault();

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
		}

		if (evt.key == 'Enter') {
			evt.preventDefault();

			if (list && list.length) {
				var {type, name} = list[Math.max(0, listIndex)];
				destroy();
				location.href = `#${type}-${name}`;
			}
		}

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

		update($('#search').value);
	}

	function update(v) {
		listIndex = -1;

		$('#search-dropdown ul').innerHTML =
			!v ? ''
			: (list = getList(v)).slice(0, listlen).map(({name, type, match}) => {
				return `<li><a href="#${type}-${name}">${name.split('').map((n, i) => {
					if (match.includes(i)) return `<b>${n}</b>`;
					return n;
				}).join('')}</a></li>`;
			}).join('');

		$$('#search-dropdown ul li a').forEach(e => e.addEventListener('click', () => {
			$('#search').value = '';
			$('#search-dropdown ul').innerHTML = '';
			$('#search-dropdown').style.display = 'none';
			$('#search-background').style.display = 'none';
		}));
	}

	function dismiss() {
		$('#search-dropdown').style.display = 'none';
		$('#search-background').style.display = 'none';

		listIndex = -1;
		[].map.call($$('#search-dropdown ul li'), (e, i) => {
			e.classList.remove('selected');
		});
	}

	function destroy() {
		$('#search').value = '';
		$('#search-dropdown ul').innerHTML = '';
		$('#search-dropdown').style.display = 'none';
		$('#search-background').style.display = 'none';
		$('#search').blur();
		listIndex = -1;
		list = null;
	}

	$('#search').addEventListener('input', () => {
		update($('#search').value);
	});
	$('#search').addEventListener('focus', show);
	$('#search-background').addEventListener('click', dismiss);
})();