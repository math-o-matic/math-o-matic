<template>
<div id="popper-tooltip-holder"></div>
</template>

<script lang="ts">
import HtmlGenerator from '../../../src/HtmlGenerator';
import SchemaDecoration from '../../../src/decoration/SchemaDecoration';
import { defineComponent } from 'vue';
import Globals from './Globals';

document.addEventListener('click', evt => {
	var $a = evt.target as HTMLElement | null;

	while ($a!.id != 'popper-tooltip-holder') {
		$a = $a!.parentElement;

		if (!$a) {
			document.querySelector('#popper-tooltip-holder')!.innerHTML = '';
			return;
		}
	}
});

document.addEventListener('click', evt => {
	var $a = evt.target as HTMLElement | null;

	while (!($a instanceof HTMLAnchorElement)) {
		$a = $a!.parentElement;

		if (!$a) return;
	}

	var match = $a.getAttribute('href')!.match(/^#id-[0-9]+$/);

	if (match) {
		let $el = document.querySelector(match[0]);

		if ($el) {
			if ($el.classList.contains('flicker')) {
				return;
			}

			$el.classList.add('flicker');

			let listener = (evt: Event) => {
				$el!.removeEventListener('animationend', listener);
				$el!.classList.remove('flicker');
			};
			
			$el.addEventListener('animationend', listener);
		}
	}

	match = $a.getAttribute('href')!.match(/^#def-(.+)$/);

	if (match) {
		var name = match[1];

		if ($a.closest('.label')) return;
		if (!$a.closest('#all')) return;

		evt.preventDefault();

		var generator = new HtmlGenerator(Globals.program!, Globals.ktx, Globals.yamd);

		if (Globals.program!.scope!.hasVariable(name)) {
			var var_ = Globals.program!.scope!.getVariable(name);
			var html;

			if (var_.decoration instanceof SchemaDecoration) {
				html = generator.schema(
					name, var_,
					Globals.expansionList.includes(name),
					true
				);
			} else {
				html = generator.def(name, var_);
			}

			document.querySelector('#popper-tooltip-holder')!.innerHTML = html;

			Globals.Popper.createPopper($a, document.querySelector('#popper-tooltip-holder *'));
		}
	}
});

export default defineComponent({});
</script>