var yamd = require('yamd'),
	hljs = require('highlight.js'),
	katex = require('katex');

yamd.set({hljs, katex});

var styles = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@10.4.1/styles/tomorrow.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/yamd@0.4/web/yamd.default.css">`;

module.exports = {
	name: 'math-o-matic docs',
	src: 'src',
	dst: 'build',
	render: text => yamd.render(text),
	templateData: {
		styles
	},
	list: [
		{
			name: 'How to write code',
			file: 'code.yamd'
		},
		{
			name: 'A comprehensive description of all math-o-matic syntaxes (TODO)',
			dir: 'syntax',
			list: [
				{
					name: 'import',
					file: 'import.yamd'
				}
			]
		},
		{
			name: 'The current axiomatic system',
			dir: 'current-axiomatic-system',
			list: [
				{
					name: 'Counterparts',
					file: 'counterparts.yamd'
				}
			]
		},
		{
			name: 'Specs for devs',
			dir: 'dev',
			list: [
				{
					name: 'Precedence',
					file: 'precedence.yamd'
				}
			]
		}
		
	]
};