var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	publicPath: '/web/',
	configureWebpack: {
		plugins: [
			new webpack.DefinePlugin({
				'process.env.__webpack__': true
			}),
			new CopyWebpackPlugin({
				patterns: [
					{from: '../dist/', to: 'public/dist/'},
					{from: '../logo/', to: 'public/logo/'},
					{from: '../math/', to: 'public/math/'}
				]
			})
		]
	}
}