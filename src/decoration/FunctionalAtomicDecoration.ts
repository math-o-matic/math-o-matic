import Parameter from "../expr/Parameter";
import Precedence from "../Precedence";

export default class FunctionalAtomicDecoration {
	
	public readonly doc: string;
	public readonly precedence: Precedence;
	public readonly tex: string;
	public readonly params: Parameter[];

	constructor ({doc, precedence, tex, params}: {doc: string, precedence: Precedence, tex: string, params: Parameter[]}) {
		this.doc = doc;
		this.precedence = precedence;
		this.tex = tex;
		this.params = params;
	}
}