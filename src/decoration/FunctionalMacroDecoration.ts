import Precedence from "../Precedence";

export default class FunctionalMacroDecoration {
	
	public readonly doc: string | null;
	public readonly precedence: Precedence;
	public readonly tex: string | null;
	public readonly sealed: boolean;

	constructor ({doc, precedence, tex, sealed}: {doc: string | null, precedence: Precedence, tex: string | null, sealed: boolean}) {
		this.doc = doc;
		this.precedence = precedence;
		this.tex = tex;
		this.sealed = sealed;
	}
}