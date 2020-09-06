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
			name: '이론',
			file: 'theory'
		},
		{
			name: '우선순위',
			file: 'precedence'
		},
		{
			name: 'ExpressionResolver의 동작방식',
			file: 'expression-resolver'
		}
	]
};