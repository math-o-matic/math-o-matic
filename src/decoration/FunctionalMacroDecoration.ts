import Precedence from "../Precedence";

export default class FunctionalMacroDecoration {
	
	public readonly doc: string;
	public readonly precedence: Precedence;
	public readonly tex: string;
	public readonly sealed: boolean;

	constructor ({doc, precedence, tex, sealed}: {doc: string, precedence: Precedence, tex: string, sealed: boolean}) {
		this.doc = doc;
		this.precedence = precedence;
		this.tex = tex;
		this.sealed = sealed;
	}
}