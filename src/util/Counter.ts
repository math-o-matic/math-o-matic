export default class Counter {

	private n: number;

	/**
	 * @param start The return value of the first `next()` call.
	 *              Defaults to 0.
	 */
	constructor (start: number=0) {
		this.n = start - 1;
	}

	public peek(): number {
		return this.n;
	}

	public next(): number {
		return ++this.n;
	}
}