const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	watch: true,
	mode: 'production',
	entry: './src/entry.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'math.js',
		library: 'math'
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					keep_fnames: true
				}
			})
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.__webpack__': true
		})
	],
	stats: {
		cached: false,
		cachedAssets: false,
		chunks: false,
		chunkModules: false,
		chunkOrigins: false,
		modules: false
	}
};