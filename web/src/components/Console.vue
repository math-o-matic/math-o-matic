<template>
<div class="console-wrap-wrap" style="display:none">
	<div class="console-wrap">
		<div id="console-display-wrap">
			<table id="console-display" style="margin: 0"></table>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import getSearchResults from "./getSearchResults";
import InterpolativeError from '../../../src/util/InterpolativeError';
import { defineComponent } from "vue";
import Globals from "./Globals";

var escapeHtml = (s: any) => (s + '').replace(/[&<>"']/g, m => ({
	'&': '&amp;', '<': '&lt;', '>': '&gt;',
	'"': '&quot;', "'": '&#39;'
})[m] as any);

type OptionsType = {
	input?: boolean,
	noescape?: boolean,
	error?: boolean
};

var timeout: any = null;
var codemirror: any = null;

export default defineComponent({
	name: 'Console',
	methods: {
		hint() {
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
					render($el: any, self: any, data: any) {
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
		},
		htmlify(value: string | Error, options?: OptionsType) {
			var {input, noescape, error} = options || {};

			var escapeOrNot = (s: string) => noescape ? s : escapeHtml(s);

			var html = '';

			if (value instanceof InterpolativeError) {
				var {strings, values} = value.interpolativeMessage;
				html += escapeOrNot(strings[0]);

				for (var i = 1; i < strings.length; i++) {
					if (values[i - 1].toTeXString) {
						html += Globals.ktx(values[i - 1].toTeXString());
					} else {
						html += escapeOrNot(values[i - 1]);
					}

					html += escapeOrNot(strings[i]);
				}
			} else {
				html = escapeOrNot(value + '');
			}

			var $tr = document.createElement('tr');
			$tr.innerHTML =  `<td>${input ? '&gt;' : '&lt;'}</td><td>${html}</td>`;
			if (error) {
				$tr.classList.add('error');
			}

			return $tr;
		},
		write(value: string | Error, options?: OptionsType) {
			var $tr = this.htmlify(value, options);

			if (document.querySelector('#console-display-preview')) {
				document.querySelector('#console-display')!.insertBefore($tr, document.querySelector('#console-display-preview'));
			} else {
				document.querySelector('#console-display')!.appendChild($tr);
			}

			document.querySelector('#console-display-wrap')!.scrollTop
				= document.querySelector('#console-display-wrap')!.scrollHeight;

			if (timeout) {
				clearTimeout(timeout);
			}

			this.removePreview();
		},
		preview(value: string | Error, options?: OptionsType) {
			var $tr = this.htmlify(value, options);

			this.removePreview();

			$tr.id = 'console-display-preview';

			document.querySelector('#console-display')!.appendChild($tr);
		},
		showPreview() {
			if (!Globals.program) {
				return this.preview('Error: program is not defined', {error: true});
			}

			var v = codemirror.getValue();
			if (!v.trim()) {
				this.removePreview();
				return;
			}

			try {
				this.preview(
					Globals.ktx(Globals.program.evaluate(v).toTeXString(undefined, true)), {
					noescape: true
				});
			} catch (e) {
				this.preview(e as Error, {error: true});
			}
		},
		removePreview() {
			if (document.querySelector('#console-display-preview')) {
				document.querySelector('#console-display')!.removeChild(
					document.querySelector('#console-display-preview')!);
			}
		},
		toggleConsole() {
			var hidden = (document.querySelector('.console-wrap-wrap')! as HTMLElement).style.display == 'none';
			(document.querySelector('.console-wrap-wrap')! as HTMLElement).style.display = hidden ? 'flex' : 'none';

			if (hidden) {
				codemirror.focus();
				codemirror.refresh();
			}
		}
	},
	mounted() {
		codemirror = Globals.CodeMirror((el: any) => {
			el.id = 'console-input';
			document.querySelector('.console-wrap')!.appendChild(el);
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

		codemirror.on('inputRead', (editor: any, event: any) => {
			Globals.CodeMirror.showHint(codemirror, this.hint, {
				completeSingle: false,
				extraKeys: {
					'Shift-Tab': (cm: any, handle: any) => {
						handle.moveFocus(-1);
					},
					Tab(cm: any, handle: any) {
						handle.moveFocus(1);
					}
				}
			});
		});

		document.querySelector('#console-input')!.addEventListener('keydown', e => {
			var evt = e as KeyboardEvent;

			var v = codemirror.getValue();

			if (timeout) {
				clearTimeout(timeout);
			}

			if (!v.trim()) {
				this.removePreview();
			} else {
				timeout = setTimeout(() => {
					this.showPreview();
					timeout = null;
				}, 1000);
			}

			if (evt.key == 'Enter') {
				// submit
				if (evt.shiftKey) {
					evt.preventDefault();

					if (!v.trim()) return;

					this.write(v.trim(), {input: true});

					if (!Globals.program) {
						return this.write('Error: program is not defined', {error: true});
					}

					try {
						this.write(
							Globals.ktx(Globals.program.evaluate(v).toTeXString(undefined, true)), {
							noescape: true
						});
					} catch (e) {
						console.error(e);
						this.write(e as Error, {error: true});
					} finally {
						if (!evt.ctrlKey) codemirror.setValue('');
					}

					return;
				}
			}

			// clear console
			if (evt.ctrlKey && evt.key == 'l') {
				evt.preventDefault();
				document.querySelector('#console-display')!.innerHTML = '';
				this.write('Console was cleared');
			}

			if (evt.key == 'F7') {
				evt.preventDefault();
				this.toggleConsole();
			}
		});

		Globals.hotkeys('c,f7', (evt: any, handler: any) => {
			evt.preventDefault();
			this.toggleConsole();
		});
	}
})
</script>