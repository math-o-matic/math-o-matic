export default class SimpleAtomicDecoration {
	
	public readonly doc: string;
	public readonly tex: string;

	constructor ({doc, tex}: {doc: string, tex: string}) {
		this.doc = doc;
		this.tex = tex;
	}
}