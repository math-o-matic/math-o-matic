const del = require('del');
const path = require('path');
const { src, dest, series } = require('gulp');
const webpack = require('webpack-stream');
const pegjs = require('gulp-pegjs');
const TerserPlugin = require('terser-webpack-plugin');

function parser() {
	return src('src/parser.pegjs')
		.pipe(pegjs({cache: true}))
		.pipe(dest('build/'));
}

function pack() {
	return src('src/entry.js')
		.pipe(webpack({
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
			resolve: {
				alias: {
					'./parser': '../build/parser'
				}
			}
		}))
		.pipe(dest('dist'));
}

function clean() {
	return del(['build']);
}

exports.default = series(parser, pack, clean);