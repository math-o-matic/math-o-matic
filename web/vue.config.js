var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var glob = require('glob');

var systempath = require('./systempath.json');

var copyPatterns = Object.keys(systempath.paths).map(k => {
	return {from: k, to: systempath.paths[k]};
});

module.exports = {
	publicPath: './',
	configureWebpack: {
		plugins: [
			new webpack.DefinePlugin({
				'process.env.__webpack__': true
			}),
			new CopyWebpackPlugin({
				patterns: copyPatterns.concat([
					{
						from: './systempath.json',
						to: 'systempath.json',
						transform: {
							transformer(content, absoluteFrom) {
								var fqns = []

								for (var path in systempath.paths) {
									fqns = fqns.concat(glob.sync('**/*.math', {cwd: path}).map(p => p.replace(/\.math$/, '').replace(/\//g, '.')));
								}
								
								return JSON.stringify({
									paths: Object.values(systempath.paths),
									fqns
								});
							}
						}
					}
				])
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