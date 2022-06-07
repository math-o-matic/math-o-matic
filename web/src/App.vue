<template>
<Nav @reload="onReloadClick" @console="onConsoleClick"/>
<h1 id="top">math-o-matic</h1>
<p>
	<a href="https://github.com/math-o-matic/math-o-matic" style="text-decoration: none;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDE2IDE2IiB2ZXJzaW9uPSIxLjEiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTggMEMzLjU4IDAgMCAzLjU4IDAgOGMwIDMuNTQgMi4yOSA2LjUzIDUuNDcgNy41OS40LjA3LjU1LS4xNy41NS0uMzggMC0uMTktLjAxLS44Mi0uMDEtMS40OS0yLjAxLjM3LTIuNTMtLjQ5LTIuNjktLjk0LS4wOS0uMjMtLjQ4LS45NC0uODItMS4xMy0uMjgtLjE1LS42OC0uNTItLjAxLS41My42My0uMDEgMS4wOC41OCAxLjIzLjgyLjcyIDEuMjEgMS44Ny44NyAyLjMzLjY2LjA3LS41Mi4yOC0uODcuNTEtMS4wNy0xLjc4LS4yLTMuNjQtLjg5LTMuNjQtMy45NSAwLS44Ny4zMS0xLjU5LjgyLTIuMTUtLjA4LS4yLS4zNi0xLjAyLjA4LTIuMTIgMCAwIC42Ny0uMjEgMi4yLjgyLjY0LS4xOCAxLjMyLS4yNyAyLS4yNy42OCAwIDEuMzYuMDkgMiAuMjcgMS41My0xLjA0IDIuMi0uODIgMi4yLS44Mi40NCAxLjEuMTYgMS45Mi4wOCAyLjEyLjUxLjU2LjgyIDEuMjcuODIgMi4xNSAwIDMuMDctMS44NyAzLjc1LTMuNjUgMy45NS4yOS4yNS41NC43My41NCAxLjQ4IDAgMS4wNy0uMDEgMS45My0uMDEgMi4yIDAgLjIxLjE1LjQ2LjU1LjM4QTguMDEzIDguMDEzIDAgMDAxNiA4YzAtNC40Mi0zLjU4LTgtOC04eiI+PC9wYXRoPjwvc3ZnPg==" style="vertical-align: middle; margin-right:.5em">GitHub repository</a> &nbsp; <a href="https://math-o-matic.github.io/math-o-matic/docs/index.html" style="text-decoration: none;"><img style="vertical-align: middle;margin-right:.5em;" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjNjY2Ij48cGF0aCBkPSJNMTQgMkg2Yy0xLjEgMC0xLjk5LjktMS45OSAyTDQgMjBjMCAxLjEuODkgMiAxLjk5IDJIMThjMS4xIDAgMi0uOSAyLTJWOGwtNi02em0yIDE2SDh2LTJoOHYyem0wLTRIOHYtMmg4djJ6bS0zLTVWMy41TDE4LjUgOUgxM3oiLz48L3N2Zz4=">documentation</a>
</p>
<blockquote v-if="isFileScheme">
	<b>Note.</b> This page seems to have been loaded using <code>file://</code> scheme, and the page might not work due to the CORS policy. The following is a list of possible solutions:
	<ul>
		<li><b>Create a local server</b>: You can easily create a static server using the <a href="https://www.npmjs.com/package/http-server">http-server</a> package from npm. At the project root run <pre><code>npx http-server -c-1</code></pre> and go to the web address displayed on the terminal.</li>
		<li><b>Set <code>--allow-file-access-from-files</code> flag in Chrome</b>: If you are using Chrome, you can enable file access by setting the <code>--allow-file-access-from-files</code> flag. <a href="https://stackoverflow.com/a/18137280">StackOverflow</a></li>
	</ul>
</blockquote>
<p style="margin-top:1em">This page shows the current math-o-matic proof system located at <code>/math</code>. Click on one of the links at the bottom of this page to load the proof system. Depending on the performance of your device this may take a lot of time.</p>
<h2>Definitions</h2>
<div id="list">Loading the systempath ...</div>
<Console ref="console" />
<div style="padding:1em;margin: 1em 0;border:1px #ccc solid; border-radius:1em">
	<div>
		<input id="radio-load-selected-file-only" name="radio-load-what" type="radio" checked value="selected-file-only">
		<label for="radio-load-selected-file-only">Show only the selected file</label>
		<input id="radio-load-selected-file-and-dependencies" name="radio-load-what" type="radio" value="selected-file-and-dependencies">
		<label for="radio-load-selected-file-and-dependencies">Also show imported files</label>
	</div>
	<p style="margin-top:1em">Not showing the imported files may break some features.</p>
</div>
<div id="summary"></div>
<div id="all"></div>
<Popper />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Nav from './components/Nav.vue';
import Console from './components/Console.vue';
import Popper from './components/Popper.vue';
import Globals from './components/Globals';

export default defineComponent({
	name: "App",
	components: { Nav, Console, Popper },
	data() {
		return {
			isFileScheme: location.protocol == "file:"
		};
	},
	methods: {
		onReloadClick() {
			Globals.reload(Globals.fqn!);
		},
		onConsoleClick() {
			(this.$refs.console as any).toggleConsole();
		}
	},
	mounted() {
		(async () => {
			var res = await fetch("systempath.json");
			if (!res.ok)
				throw Error(res.statusText);
			
			Globals.systempath = await res.json();console.log(Globals.systempath);

			var html = '<ul>' + Globals.systempath!.fqns.map(fqn => {
				return `<li><a href="javascript:Globals.reload('${fqn}')"><b>system</b> ${fqn}</a></li>`;
			}).join('') + '</ul>';

			document.querySelector("#list")!.innerHTML = html;
		})();
	}
});

Globals.hotkeys('r', (evt: any, handler: any) => {
	evt.preventDefault();
	Globals.reload(Globals.fqn!);
});
</script>

<style>
h1, h2, h3, h4, h5, h6, a, b, strong, input, textarea, th, .katex {
	color: #202124;
}

p {
	margin: 0;
}

p + p {
	margin-top: 1em;
}

pre, code {
	font-family: Consolas, 'Roboto Mono', monospace;
	background-color: rgba(0,0,0,.05);
	white-space: pre-wrap;
	word-break: break-all;
	tab-size: 4;
}

pre {
	padding: 6px;
}

code {
	font-size: .85em;
	padding: .15em .3em;
	border-radius: .3em;
}

pre code {
	background-color: unset;
	padding: 0;
}

table {
	border: 1px #ccc solid;
	border-collapse: collapse;
	margin: 1em 0;
}

table tr td, table tr th {
	padding: .2em .5em;
	border: 1px #ccc solid;
}

input[type=button], input[type=submit], button {
	background: none;
	border: none;
	border-radius: 3px;
	padding: 1ex 1em;
	cursor: pointer;
	font: .85em Roboto, sans-serif;
	margin: .15em;
}

textarea {
	font: .85em Consolas, 'Roboto Mono', monospace;
}

kbd {
	font: .85em Consolas, 'Roboto Mono', monospace;
	color: #202124;
	border: 1px #ccc solid;
	padding: .1em .3em;
	border-radius: .2em;
}

blockquote {
	margin: 1em 0;
	padding: .5em 20px;
	border-left: 5px #202124 solid;
	background-color: #f7f7f7;
}

nav {
	display: flex;
	position: fixed;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	top: 0;
	left: 0;
	right: 0;
	z-index: 10000;
	background-color: white;
	border-top: 5px #222 solid;
	box-shadow: 0 0 2px 0 rgba(0,0,0,.16),0 0 0 1px rgba(0,0,0,.08);
	padding: 0 15px;
}

#whatever {
	display: inline-flex;
	position: relative;
	justify-content: flex-end;
	align-items: center;
	align-content: center;
	flex-wrap: wrap;
}

.colored {
	background-color: #202124!important;
	color: #eee;
}

.block {
	padding: 1em;
	background-color: #fafafa;
	border: 1px #ccc solid;
	border-radius: 3px;
	margin: 1em 0;
}

.mono {
	font-family: 'Roboto Mono', monospace, monospace;
}

.label {
	font-family: 'Roboto Mono', monospace, monospace;
}

#top, .label a, [id^="id-"] {
	scroll-margin: 100px;
}

.math {
	font-size: 1.2em;
	margin: 1em 0;
}

.katex .vlist-r {
	pointer-events: none;
}

.katex a {
	text-decoration: none;
	color: inherit;
	pointer-events: auto;
}

.katex a[href^="#def-"] > :not(.mspace) {
	background-color: #E3F2FD;
	border-radius: .15em;
	color: #303F9F;
}

.katex [data-proved="np"] > :not(.mspace) {
	background-color: #FFEBEE;
	border-radius: .15em;
	color: #B71C1C;
}

.katex [data-proved="p"] > :not(.mspace) {
	background-color: #E8F5E9;
	border-radius: .15em;
	color: #006064;
}

.katex a[href^="#type-"] > :not(.mspace) {
	background-color: #E8EAF6;
	border-radius: .15em;
	color: #1A237E;
}

.katex a[href^="#id-"] > :not(.mspace) {
	color: #E65100;
}

table.explorer td {
	white-space: nowrap;
}

table.explorer td.brb {
	border-right: 3px #222 solid;
	text-align: right;
	width: 1px;
}

table.explorer td.rrb {
	border-right: 3px #D32F2F solid;
	text-align: right;
	width: 1px;
}

table.explorer td.bbb {
	border-bottom: 3px #222 solid;
}

.red {
	 color: #D32F2F;
}

.console-wrap-wrap {
	display: flex;
	flex-direction: column;
	position: fixed;
	z-index: 9000;
	top: 60px;
	bottom: 5px;
	right: 5px;
	min-width: 300px;
	max-width: calc(100% - 110px);
	font-family: Consolas, 'Roboto Mono', monospace;
	pointer-events: none;
}

.console-wrap {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: stretch;
	min-height: 0;
}

#console-display-wrap {
	background: white;
	flex-grow: 0;
	flex-shrink: 1;
	overflow: auto;
	min-height: 0;
	pointer-events: auto;
}

#console-display {
	width: 100%;
	white-space: pre-wrap;
	font-size: .85em;
}

#console-display .katex {
	font-size: 1.4em;
}

#console-display tr.error {
	background-color: #FFEBEE;
	color: #B71C1C;
}

#console-display td {
	border: none;
	vertical-align: top;
}

#console-display td:first-child {
	width: 1px;
}

#console-display tr {
	border: 1px #ccc solid;
}

#console-display-preview {
	opacity: .7;
}

#search-input {
	padding: .3em;
	width: 200px;
}

#search-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
}

#search-dropdown ul {
	display: inline-block;
	min-width: 200px;
	margin: 0;
	padding: 0;
	background-color: white;
}

#search-dropdown ul li {
	list-style: none;
	border: 1px #ccc solid;
	padding: .15em;
}

#search-dropdown ul li + li {
	border-top: none;
}

#search-dropdown ul li:hover {
	background-color: #eee;
}

#search-dropdown ul li.selected a::before {
	content: '> ';
	display: inline;
	font-weight: bold;
}

#search-dropdown ul li a {
	display: block;
	padding: .1em .3em;
	color: #5f6368;
	text-decoration: none;
}

#console-input {
	pointer-events: auto;
	flex-shrink: 0;
}

#popper-tooltip-holder .block {
	background-color: aliceblue;
}

.CodeMirror {
	z-index: 10000!important;
	border: 1px #666 solid;
	font-size: .90em;
	font-family: Consolas, 'Roboto Mono', monospace;
	height: auto;
	min-height: 90px;
	max-height: 50%;
}

.CodeMirror-focused .CodeMirror-selected {
	background-color: #90CAF9;
}

.CodeMirror-scroll {
	min-height: 50px;
}

.CodeMirror-readonly {
	background-color: #f3f3f3;
}

.CodeMirror-placeholder {
	color: #5f6368!important;
}

.CodeMirror-composing {
	border-bottom: 1px solid;
}

.CodeMirror-cursors, .CodeMirror-cursor {
	z-index: 10005!important;
}

.CodeMirror-hints {
	z-index: 10010!important;
	box-shadow: none;
	border: 1px #666 solid;
	border-radius: 0;
	font-family: Consolas, 'Roboto Mono', monospace;
}

.CodeMirror-hint {
	border-radius: 0;
	color: unset;
}

.CodeMirror-hint.CodeMirror-hint-active {
	background-color: #f2f2f2;
	color: unset;
}

.yamd-error {
	color: red;
}

.flicker {
	animation: flicker 1s 1 normal!important;
}

.rotate {
	animation: rotate 1s linear infinite normal!important;
}

@keyframes flicker {
	0%, 100% {
		background-color: transparent;
	}
  
	25% {
		background-color: #FFFF00;
	}
}

@keyframes rotate {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}
</style>
