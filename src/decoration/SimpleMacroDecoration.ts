export default class SimpleMacroDecoration {
	
	public readonly doc: string | null;
	public readonly tex: string | null;
	public readonly sealed: boolean;

	constructor ({doc, tex, sealed}: {doc: string | null, tex: string | null, sealed: boolean}) {
		this.doc = doc;
		this.tex = tex;
		this.sealed = sealed;
	}
}