import Parameter from "../expr/Parameter";
import Precedence from "../Precedence";

export default class FunctionalAtomicDecoration {
	
	public readonly doc: string | null;
	public readonly precedence: Precedence;
	public readonly tex: string | null;
	public readonly params: Parameter[];

	constructor ({doc, precedence, tex, params}: {doc: string | null, precedence: Precedence, tex: string | null, params: Parameter[]}) {
		this.doc = doc;
		this.precedence = precedence;
		this.tex = tex;
		this.params = params;
	}
}