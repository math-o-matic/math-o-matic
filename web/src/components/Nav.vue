<template>
<nav>
	<a href="#top" style="color: #222; font-size: 2em; text-decoration: none; display: flex">
		<img src="../../../logo/logomark.svg" height="26">
	</a>
	<p id="currently-loaded-thing" class="label"><b></b></p>
	<div id="whatever" style="display:flex">
		<input id="search-input" type="text" placeholder="Search (S)" class="mono" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
		<button id="reload" title="reload (R)" style="display:flex" @click="onReloadClick"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#222" width="24px" height="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button>
		<button id="button-show-console" title="console (C/F7)" style="display:flex" @click="onConsoleClick"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#222" width="24px" height="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg></button>
		<div id="search-dropdown" class="mono" style="display: none;">
			<ul></ul>
		</div>
	</div>
</nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import getSearchResults from "./getSearchResults";
import Globals from "./Globals";

export default defineComponent({
	name: 'Nav',
	methods: {
		onReloadClick() {
			this.$emit('reload');
		},
		onConsoleClick() {
			this.$emit('console');
		}
	},
	mounted() {
		var $input = document.querySelector('#search-input') as HTMLInputElement,
			$dropdown = document.querySelector('#search-dropdown') as HTMLElement;

		function show() {
			$dropdown.style.display = 'block';
			$input.select();
		}

		function dismiss() {
			$dropdown.style.display = 'none';
			$input.blur();
		}

		function destroy() {
			dismiss();
			$input.value = '';
			selected = false;
			list = [];
			$dropdown.querySelector('ul')!.innerHTML = '';
		}

		Globals.hotkeys('s', (evt: any, handler: any) => {
			evt.preventDefault();
			$input.focus();
		});

		var selected: false | number = false,
			list: string[] = [];

		$input.addEventListener('focus', evt => {
			show();
		});

		document.addEventListener('click', evt => {
			if (evt.target == $input || (evt.target as HTMLElement).closest('#search-dropdown')) return;

			dismiss();
		})

		$input.addEventListener('input', evt => {
			var v = $input.value;
			var $el = $dropdown.querySelector('ul') as HTMLElement;
			var html = '';

			list = [];

			getSearchResults(v, '', Globals.searchDatabase).forEach(({name, match}, i) => {
				if (i == 0) selected = 0;

				html += `<li${i == 0 ? ' class="selected"' : ''}><a href="#def-${name}">`
					+ name.split('').map((e, i) => {
					return match.includes(i) ? `<b>${e}</b>` : e;
				}).join('') + '</a></li>';

				list.push(name);
			});

			$el.innerHTML = html;

			[].forEach.call($el.querySelectorAll('a'), ($: HTMLAnchorElement) => {
				$.addEventListener('click', evt => { destroy() });
			});
		});

		$input.addEventListener('keydown', evt => {
			if (evt.key == 'Enter') {
				evt.preventDefault();
				if (selected === false || !list[selected]) return;

				location.href = '#def-' + list[selected];
				destroy();
			}

			if (evt.key == 'Escape') {
				evt.preventDefault();
				dismiss();
			}

			if (['ArrowDown', 'ArrowUp', 'Tab'].includes(evt.key)) {
				var direction = evt.key == 'Tab'
					? evt.shiftKey ? -1 : 1
					: evt.key == 'ArrowUp' ? -1 : 1;

				evt.preventDefault();

				var len = list.length;
				if (len <= 0 || selected === false) {
					selected = false;
					return;
				}

				selected = (selected + direction + len) % len;

				[].map.call($dropdown.querySelectorAll('li'), ($: HTMLElement, i) => {
					$.classList[i == selected ? 'add' : 'remove']('selected');
				});
			}
		});
	}
});
</script>