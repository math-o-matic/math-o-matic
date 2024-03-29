var maxSearchResultsLength = 10;

export default function getSearchResults(
		keyword: string, inputBefore: string, list: string[]
		): {name: string, match: number[]}[] {
	
	keyword = keyword.toLowerCase().trim();

	if (!keyword || keyword == '$') return [];

	return ((
			keyword.startsWith('$')
				? [...new Set(inputBefore.match(/\$?[a-z0-9_]*/gi))]
				: list
		)
		.map(name => {
			var lowername = name.toLowerCase();

			var pname = 0;
			var matchptrs = [];

			for (var pval = 0; pval < keyword.length; pval++) {
				if (pname >= name.length) return false;
				
				while (lowername[pname] != keyword[pval]) {
					pname++;
					if (pname >= name.length) return false;
				}

				matchptrs.push(pname);
				pname++;
			}

			return {
				name,
				match: matchptrs
			};
		})
		.filter(e => e) as {
			name: string,
			match: number[]
		}[])
		.sort((a, b) => {
			for (var i = 0; i < a.match.length; i++) {
				if (a.match[i] != b.match[i])
					return a.match[i] - b.match[i];
			}

			return a.name.localeCompare(b.name);
		})
		.slice(0, maxSearchResultsLength);
}