export default class Precedence {

	public static readonly FUNEXPR = new Precedence(1000);
	public static readonly COMMA = new Precedence(1000);
	public static readonly COLONEQQ = new Precedence(100000);
	public static readonly ZERO = new Precedence(0);
	public static readonly INFINITY = new Precedence([2, 0]);

	private precedence: [number, number];

	constructor (precedence: number | [number, number]) {
		this.precedence = Precedence.normalizePrecedence(precedence);
	}

	public static normalizePrecedence(prec: number | [number, number]): [number, number] {
		if (typeof prec == 'number') return [0, prec];

		if (!(prec instanceof Array && prec.length == 2)) {
			console.log(prec);
			throw Error('wut');
		}

		return prec;
	}

	/**
	 * If my == 0 returns false.
	 * Otherwise checks if my >= your.
	 */
	public shouldPutParentheses(your: Precedence): boolean {
		var myarr = this.precedence;
		var yourarr = your.precedence;

		if (myarr[0] == 0 && myarr[1] == 0) return false;

		return !(myarr[0] < yourarr[0] || myarr[0] == yourarr[0] && myarr[1] < yourarr[1]);
	}

	public toString(): string {
		if (this.precedence[0] == 0) return this.precedence[1] + '';
		return this.precedence.join(':');
	}
}