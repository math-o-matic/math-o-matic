var pegjs = require('pegjs');
var fs = require('fs');
var path = require('path');

var code = fs.readFileSync(path.join(__dirname, 'parser.pegjs'), 'utf-8');

module.exports = pegjs.generate(code, {cache: true});