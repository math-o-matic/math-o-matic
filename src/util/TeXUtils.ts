export default class TeXUtils {
	public static escapeTeX(s: string): string {
		return s.replace(/&|%|\$|#|_|{|}|~|\^|\\/g, m => ({
			'&': '\\&', '%': '\\%', '$': '\\$',
			'#': '\\#', '_': '\\_', '{': '\\{',
			'}': '\\}',
			'~': '\\textasciitilde',
			'^': '\\textasciicircum',
			'\\': '\\textbackslash'
		})[m]!);
	}

	/**
	 * 'a' -> 'a'
	 * 'alpha1' => '\alpha_1'
	 */
	public static makeTeXName(name: string): string {
		var alphabet = [
			"alpha", "beta", "gamma", "delta",
			"epsilon", "zeta", "eta", "theta",
			"iota", "kappa", "lambda", "mu",
			"nu", "xi", "omicron", "pi",
			"rho", "sigma", "tau", "upsilon",
			"phi", "chi", "psi", "omega"
		];

		var regex = new RegExp(`^(?:([a-z])|(${alphabet.join('|')}))([0-9]*)$`, 'i');
		var match = name.match(regex);

		if (match) {
			var letter = (() => {
				if (match[1]) return match[1];
				
				var capitalize = match[2].charCodeAt(0) <= 'Z'.charCodeAt(0);
				var commandName = match[2].toLowerCase();

				if (capitalize) {
					commandName = commandName[0].toUpperCase() + commandName.substring(1);
				}

				return '\\' + commandName;
			})();

			var subscript = (() => {
				if (!match[3]) return '';
				if (match[3].length == 1) return '_' + match[3];
				return `_{${match[3]}}`;
			})();

			return letter + subscript;
		}

		if (name.length == 1) {
			return TeXUtils.escapeTeX(name);
		}

		return `\\mathrm{${TeXUtils.escapeTeX(name)}}`;
	}
}