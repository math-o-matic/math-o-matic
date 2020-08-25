var m42kup = require('m42kup'),
	hljs = require('highlight.js'),
	katex = require('katex');

m42kup.set({hljs, katex});

module.exports = {
	name: 'math-o-matic 명세',
	src: 'src',
	dst: 'build',
	render: text => m42kup.render(text),
	list: [
		{
			name: '수학적 모형',
			dir: 'theory',
			list: [
				{
					name: '대강의 모형',
					file: 'model'
				},
				{
					name: 'D 함수와 증명연쇄에 관하여',
					file: 'd'
				},
				{
					name: 'U 함수에 관하여',
					file: 'u'
				},
				{
					name: 'E 함수???',
					file: 'e'
				},
				{
					name: '다계층 D 함수???',
					file: 'multilayer'
				}
			]
		},
		{
			name: 'ExpressionResolver의 동작방식',
			file: 'expression-resolver'
		}
	]
};