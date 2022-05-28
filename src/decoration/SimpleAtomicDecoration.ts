export default class SimpleAtomicDecoration {
	
	public readonly doc: string | null;
	public readonly tex: string | null;

	constructor ({doc, tex}: {doc: string | null, tex: string | null}) {
		this.doc = doc;
		this.tex = tex;
	}
}