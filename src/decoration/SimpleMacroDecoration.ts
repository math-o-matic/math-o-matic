export default class SimpleMacroDecoration {
	
	public readonly doc: string;
	public readonly tex: string;
	public readonly sealed: boolean;

	constructor ({doc, tex, sealed}: {doc: string, tex: string, sealed: boolean}) {
		this.doc = doc;
		this.tex = tex;
		this.sealed = sealed;
	}
}