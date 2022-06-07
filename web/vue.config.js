var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	publicPath: './',
	configureWebpack: {
		plugins: [
			new webpack.DefinePlugin({
				'process.env.__webpack__': true
			}),
			new CopyWebpackPlugin({
				patterns: [
					{from: '../math/', to: 'public/math/'}
				]
			})
		]
	},
	chainWebpack: config => {
		config.optimization
			.minimizer('terser')
			.tap(args => {
				const { terserOptions } = args[0]
				terserOptions.keep_classnames = true
				terserOptions.keep_fnames = true
				return args
			});
	}
}