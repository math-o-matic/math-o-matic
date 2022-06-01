import Calculus from "./Calculus";
import FunctionalAtomicDecoration from "./decoration/FunctionalAtomicDecoration";
import FunctionalMacroDecoration from "./decoration/FunctionalMacroDecoration";
import SchemaDecoration from "./decoration/SchemaDecoration";
import Fun from "./expr/Fun";
import Parameter from "./expr/Parameter";
import Variable from "./expr/Variable";
import Program from "./Program";
import SystemScope from "./scope/SystemScope";
import Type from "./type/Type";

export default class HtmlGenerator {

	public readonly program: Program;
	public readonly ktx: (s: string) => string;
	public readonly yamd: {render: (s: string) => string};

	constructor (program: Program, ktx: (s: string) => string, yamd: {render: (s: string) => string}) {
		if (!program || !ktx || !yamd) {
			throw Error('wut');
		}

		this.program = program;
		this.ktx = ktx;
		this.yamd = yamd;
	}

	public typedef(k: string, v: Type) {
		return `<div class="block">`
			+ `<p class="label"><a id="type-${k}" href="#type-${k}"><b>type</b> ${k}</a></p>`
			+ `<div class="math">${this.ktx(v.toTeXString(true))}</div>`
	
			+ (
				v.doc
				? '<p class="label"><b>description</b></p>'
					+ `<p class="description">${this.yamd.render(v.doc)}</p>`
				: ''
			)
	
			+ `</div>`;
	}

	public def(k: string, v: Variable) {
		return `<div class="block">`
			+ `<p class="label"><a id="def-${k}" href="#def-${k}"><b>${
				'sealed' in v.decoration && v.decoration.sealed ? 'sealed ' : ''
			}definition</b> ${k}</a>${!(v.decoration instanceof FunctionalAtomicDecoration || v.decoration instanceof FunctionalMacroDecoration)
					? ': ' + v.type
					: (v => {
						var params: Parameter[];

						if (v.decoration instanceof FunctionalAtomicDecoration) {
							params = v.decoration.params;
						} else {
							if (!(v.expr instanceof Fun)) {
								throw Error('wut');
							}

							params = v.expr.params;
						}

						return `(${params.map(p => p.toSimpleString()).join(', ')})`
								+ `: ${v.type.resolveToFunctionalType().to}`;
					})(v)
			}</p>`
			+ `<div class="math">${this.ktx(v.toTeXString(undefined, true))}</div>`
	
			+ (
				v.decoration.doc
				? '<p class="label"><b>description</b></p>'
					+ `<p class="description">${this.yamd.render(v.decoration.doc)}</p>`
				: ''
			)
	
			+ `</div>`;
	}
	
	public schema(k: string, v: Variable, expandProofExplorer: boolean, omitProofExplorer: boolean) {
		if (!(v.decoration instanceof SchemaDecoration)) {
			throw Error('wut');
		}

		if (!(v.expr instanceof Fun)) {
			throw Error('wut');
		}

		return `<div class="block">`
			+ `<p class="label"><a id="def-${k}" href="#def-${k}"><b>${v.decoration.schemaType}</b> ${k}</a>(${v.expr.params.map(p => p.toSimpleString()).join(', ')})${
				v.decoration.context.usingList.length
					? ` <b>using</b> ${v.decoration.context.usingList.map(u => u.name).join(', ')}`
					: ''
			}</p>`
			+ `<div class="math">${this.ktx(v.toTeXString(undefined, true))}</div>`
	
			+ (
				!v.expr || v.decoration.schemaType == 'axiom' || omitProofExplorer
					? ''
					: '<p class="label"><b>proof explorer</b></p>'
						+ (
							expandProofExplorer
								? `<p>${this.program.getProofExplorer(k, this.ktx, this.yamd)}</p>`
								: `<p><input type="button" value="show" class="colored button-expand-proof" onclick="this.parentElement.innerHTML = Globals.program.getProofExplorer('${k}', ktx, yamd);Globals.expansionList.push('${k}');"></p>`
						)
			)
	
			+ (
				v.decoration.doc
				? '<p class="label"><b>description</b></p>'
					+ `<p class="description">${this.yamd.render(v.decoration.doc)}</p>`
				: ''
			)
	
			+ `</div>`;
	}
	
	public generate(filename: string, expansionList: string[], includeImports: boolean) {
		var precedenceMap = new Map<string, string[]>();
	
		var primitiveTypeList: string[] = [],
			macroTypeList: string[] = [],
			primitiveDefinitionList: string[] = [],
			macroDefinitionList: string[] = [],
			axiomSchemaList: string[] = [],
			notProvedList: string[] = [],
			provedList: string[] = [];
	
		var printThisScope = (scope: SystemScope) => {
			var map: {[k: string]: string} = {};
	
			for (let [k, v] of scope.variableMap) {
				if (v.decoration instanceof SchemaDecoration) continue;
				if (!('precedence' in v.decoration) || !v.decoration.precedence) continue;
	
				var prec = v.decoration.precedence.toString();
				
				if (precedenceMap.has(prec)) {
					precedenceMap.set(prec, precedenceMap.get(prec)!.concat([k]));
				} else {
					precedenceMap.set(prec, [k]);
				}
			}
	
			primitiveTypeList = primitiveTypeList.concat(
				[...scope.typeMap]
					.filter(([k, v]) => !v.expr).map(([k, v]) => k)
			);
	
			macroTypeList = macroTypeList.concat(
				[...scope.typeMap]
					.filter(([k, v]) => v.expr).map(([k, v]) => k)
			);
	
			primitiveDefinitionList = primitiveDefinitionList.concat(
				[...scope.variableMap]
					.filter(([k, v]) => !(v.decoration instanceof SchemaDecoration) && !v.expr).map(([k, v]) => k)
			);
	
			macroDefinitionList = macroDefinitionList.concat(
				[...scope.variableMap]
					.filter(([k, v]) => !(v.decoration instanceof SchemaDecoration) && v.expr).map(([k, v]) => k)
			);
			
			axiomSchemaList = axiomSchemaList.concat(
				[...scope.variableMap]
					.filter(([k, v]) => v.decoration instanceof SchemaDecoration && v.decoration.schemaType == 'axiom').map(([k, v]) => k)
			);
	
			notProvedList = notProvedList.concat(
				[...scope.variableMap]
					.filter(([k, v]) => v.decoration instanceof SchemaDecoration && !Calculus.isProved(v)).map(([k, v]) => k)
			);
	
			provedList = provedList.concat(
				[...scope.variableMap]
					.filter(([k, v]) => v.decoration instanceof SchemaDecoration && v.decoration.schemaType != 'axiom' && Calculus.isProved(v)).map(([k, v]) => k)
			);
	
			for (let [k, v] of scope.typeMap) {
				map[v._id] = this.typedef(k, v);
			}
	
			for (let [k, v] of scope.variableMap) {
				if (v.decoration instanceof SchemaDecoration) {
					map[v._id] = this.schema(k, v, expansionList.includes(k), false);
				} else {
					map[v._id] = this.def(k, v);
				}
			}
	
			return `<h3 class="label">system ${scope.name}${
				scope.extendsMap.size
				? ' extends ' + [...scope.extendsMap.keys()].join(', ')
				: ''
			} (${Object.keys(map).length})</h3><div class="block-file">`
				+ Object.keys(map).sort((l, r) => Number(l) - Number(r)).map(k => map[k]).join('')
				+ '</div>';
		};
	
		var visitedFiles = [filename];
	
		function printImportedScopes(scope: SystemScope) {
			var ret = '';
	
			for (var [k, s] of scope.extendsMap) {
				if (visitedFiles.includes(k)) continue;
				visitedFiles.push(k);
	
				ret += printImportedScopes(s);
				ret += printThisScope(s);
			}
	
			return ret;
		}

		var all = '';

		if (!this.program.scope) {
			throw Error('wut');
		}
		
		if (includeImports) {
			all += printImportedScopes(this.program.scope);
		}
		
		all += printThisScope(this.program.scope);
		
	
		var precedenceTable = [...precedenceMap].sort((a, b) => Number(a[0]) - Number(b[0]));
	
		var ret = {
			'#precedence': `
<table>
	<tr><th>Precedence</th><th>Operators</th></tr>
	${precedenceTable.map(([k, v]) => {
		return `<tr><td>${k}</td><td>${v.map(w => {
			return `<a href="#def-${w}">${w}</a>`;
		}).join(', ')}</td></tr>`;
	}).join('')}
</table>`,
			'#summary': `
<ul>
	<li><p><b>Types</b> (${primitiveTypeList.length + macroTypeList.length})</p>
	<ul>
		<li><b>Atomic types</b> (${primitiveTypeList.length}): ${
			primitiveTypeList.map(n => `<a href="#type-${n}">${n}</a>`).join(', ')
		}
		<li><b>Macro types</b> (${macroTypeList.length}): ${
			macroTypeList.map(n => `<a href="#type-${n}">${n}</a>`).join(', ')
		}
	</ul>

	<li><p><b>Variable declarations</b> (${primitiveDefinitionList.length + macroDefinitionList.length})</p>
	<ul>
		<li><b>Atomic variables</b> (${primitiveDefinitionList.length}): ${
			primitiveDefinitionList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
		<li><b>Macro variables</b> (${macroDefinitionList.length}): ${
			macroDefinitionList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
	</ul>
	
	<li><p><b>Schemata</b> (${axiomSchemaList.length + notProvedList.length + provedList.length})</p>
	<ul>
		<li><b>Axioms</b> (${axiomSchemaList.length}): ${
			axiomSchemaList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
		<li><b>Not proved</b> (${notProvedList.length}): ${
			notProvedList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
		<li><b>Theorems</b> (${provedList.length})
	</ul>
</ul>`,
			'#all': all
		};

		return ret;
	}
}