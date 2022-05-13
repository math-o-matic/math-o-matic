import Precedence from "../Precedence";

export default class FunctionalAtomicDecoration {
	
	public readonly doc: string;
	public readonly precedence: Precedence;
	public readonly tex: string;

	constructor ({doc, precedence, tex}: {doc: string, precedence: Precedence, tex: string}) {
		this.doc = doc;
		this.precedence = precedence;
		this.tex = tex;
	}
}