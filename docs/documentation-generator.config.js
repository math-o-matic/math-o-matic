var m42kup = require('m42kup'),
	hljs = require('highlight.js'),
	katex = require('katex');

m42kup.set({hljs, katex});

var styles = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@10.4.1/styles/tomorrow.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/m42kup@0.3.0/web/m42kup.default.css">`;

module.exports = {
	name: 'math-o-matic 설명서',
	src: 'src',
	dst: 'build',
	render: text => m42kup.render(text),
	templateData: {
		styles
	},
	list: [
		{
			name: '코드를 작성하는 법',
			file: 'code.m42kup'
		},
		{
			name: '문법',
			dir: 'syntax',
			list: [
				{
					name: 'import',
					file: 'import.m42kup'
				}
			]
		},
		{
			name: '현재의 공리계',
			dir: 'current-axiomatic-system',
			list: [
				{
					name: '대응 관계',
					file: 'counterparts.m42kup'
				}
			]
		},
		{
			name: '개발자를 위한 명세',
			dir: 'dev',
			list: [
				{
					name: '우선순위',
					file: 'precedence.m42kup'
				}
			]
		}
		
	]
};