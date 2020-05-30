var m42kup = require('m42kup'),
	hljs = require('highlight.js'),
	katex = require('katex');

m42kup.set({hljs, katex});

module.exports = {
	name: 'M42/math 명세',
	src: 'src',
	dst: 'build',
	render: text => m42kup.render(text),
	list: [
		{
			name: '모형',
			file: 'model'
		},
		{
			name: 'ExpressionResolver의 동작방식',
			file: 'expression-resolver'
		}
	]
};