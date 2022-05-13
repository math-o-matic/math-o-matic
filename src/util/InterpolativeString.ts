/**
 * Use as follows:
 * 
 * InterpolativeString.getInstance`Expression ${expr1} and ${expr2} are not equal`;
 */
export default class InterpolativeString extends String {

	public strings: string[];
	public values: any[];

	private constructor (strings: string[], values: any[]) {
		super(InterpolativeString.toString(strings, values));
		this.strings = strings;
		this.values = values;
	}

	public static override toString(strings: string[], values: any[]): string {
		if (strings.length == 0) return '';

		var ret = strings[0];

		for (var i = 1; i < strings.length; i++) {
			ret += values[i - 1] + strings[i];
		}

		return ret;
	}

	public static getInstance(strings: TemplateStringsArray, ...values: any[]): InterpolativeString {
		return new InterpolativeString(
			// @ts-ignore
			strings,
			values
		);
	}

	public concatStrings(...strings: string[]): InterpolativeString {
		var myStrings = this.strings.slice();
		myStrings[myStrings.length - 1] += strings.join('');
		return InterpolativeString.getInstance(
			// @ts-ignore
			myStrings,
			...this.values
		)
	}
}