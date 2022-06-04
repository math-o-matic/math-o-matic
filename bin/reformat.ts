import unparse from "../src/Unparser";
import fs from 'fs';
import path from 'path';
import pegjs from 'pegjs';
import { glob } from "glob";
import mkdirp from 'mkdirp';

var grammar = fs.readFileSync(path.join(__dirname, '../src/grammar.pegjs'), 'utf-8');
var parser = pegjs.generate(grammar, {cache: true});

var src = path.join(__dirname, '../math/');
var dst = path.join(__dirname, '../math-reformatted/');

if (!fs.existsSync(dst)) {
	fs.mkdirSync(dst);
}

glob.sync('**/*.math', {cwd: src}).forEach(file => {
	var srcFile = path.join(src, file);
	var code = fs.readFileSync(srcFile, 'utf-8');

	var newcode = unparse(parser.parse(code));
	
	var dstFile = path.join(dst, file);
	var dstDir = path.dirname(dstFile);

	mkdirp.sync(dstDir);
	fs.writeFileSync(path.join(dst, file), newcode);
});