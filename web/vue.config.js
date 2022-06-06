var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	publicPath: '/math-o-matic/',
	configureWebpack: {
		plugins: [
			new webpack.DefinePlugin({
				'process.env.__webpack__': true
			}),
			new CopyWebpackPlugin({
				patterns: [
					{from: '../logo/', to: 'public/logo/'},
					{from: '../math/', to: 'public/math/'}
				]
			})
		]
	}
}