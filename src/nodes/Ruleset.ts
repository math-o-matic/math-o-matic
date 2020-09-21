import Scope from '../Scope';
import Node, { Precedence } from './Node';

export default class Ruleset extends Node {
	public readonly _type = 'ruleset';

	public readonly axiomatic: boolean;
	public readonly name: string;
	public readonly native;

	constructor ({axiomatic, name, native, doc}, scope?: Scope) {
		super(scope);

		this.doc = doc;

		if (typeof name != 'string')
			throw this.error('Assertion failed');

		if (!native)
			throw this.error('Assertion failed');
		
		this.axiomatic = axiomatic;
		this.name = name;
		this.native = native || false;
	}

	public isProved(hyps) {
		hyps = hyps || [];
		
		return super.isProved(hyps) || this.axiomatic;
	}

	public toIndentedString(indent: number, root?: boolean): string {
		return `RS ${this.name}`
			+ (this.native ? ' <native>' : ' <error>');
	}
	public toTeXString(prec?: Precedence, root?: boolean): string {
		return `\\href{#ruleset-${this.name}}{\\mathsf{${Node.escapeTeX(this.name)}}}`
			+ (this.native ? '\\ (\\textrm{native})' : '\\ (\\textit{error})');
	}
}