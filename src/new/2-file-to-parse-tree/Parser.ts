import path from 'path';
import fs from 'fs';
import pegjs from 'pegjs';
import { PFile } from "./ParseTreeDefinitions";

export type ParserType = {
	parse: (code: string) => PFile;
};

let grammar = fs.readFileSync(path.join(__dirname, './grammar.pegjs'), 'utf-8');
let parser: ParserType = pegjs.generate(grammar, {cache: true});

export default parser;