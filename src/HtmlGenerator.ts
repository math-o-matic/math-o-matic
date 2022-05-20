import Calculus from "./Calculus";
import SchemaDecoration from "./decoration/SchemaDecoration";
import Fun from "./expr/Fun";
import { Type } from "./expr/types";
import Variable from "./expr/Variable";
import Program from "./Program";
import Scope from "./Scope";

export default class HtmlGenerator {

	public readonly program: Program;
	public readonly ktx: (s: string) => string;
	public readonly m42kup: {render: (s: string) => string};

	constructor (program: Program, ktx: (s: string) => string, m42kup: {render: (s: string) => string}) {
		if (!program || !ktx || !m42kup) {
			throw Error('wut');
		}

		this.program = program;
		this.ktx = ktx;
		this.m42kup = m42kup;
	}

	public typedef(k: string, v: Type) {
		return `<div class="block">`
			+ `<p class="label"><a id="type-${k}" href="#type-${k}"><b>type</b> ${k}</a></p>`
			+ `<div class="math">${this.ktx(v.toTeXString(true))}</div>`
	
			+ (
				v.doc
				? '<p class="label"><b>description</b></p>'
					+ `<p class="description">${this.m42kup.render(v.doc)}</p>`
				: ''
			)
	
			+ `</div>`;
	}

	public def(k: string, v: Variable | Fun) {
		return `<div class="block">`
			+ `<p class="label"><a id="def-${k}" href="#def-${k}"><b>${
				'sealed' in v.decoration && v.decoration.sealed ? 'sealed ' : ''
			}definition</b> ${k}</a>${!(v instanceof Fun)
					? ': ' + v.type
					: `(${v.params.map(p => p.toSimpleString()).join(', ')})`
						+ `: ${v.type.resolveToFunctionalType().to}`
			}</p>`
			+ `<div class="math">${this.ktx(v.toTeXString(null, true))}</div>`
	
			+ (
				v.decoration.doc
				? '<p class="label"><b>description</b></p>'
					+ `<p class="description">${this.m42kup.render(v.decoration.doc)}</p>`
				: ''
			)
	
			+ `</div>`;
	}
	
	public schema(k: string, v: Fun, expandProofExplorer: boolean, omitProofExplorer: boolean) {
		if (!(v.decoration instanceof SchemaDecoration)) {
			throw Error('wut');
		}

		return `<div class="block">`
			+ `<p class="label"><a id="def-${k}" href="#def-${k}"><b>${v.decoration.schemaType}</b> ${k}</a>(${v.params.map(p => p.toSimpleString()).join(', ')})${
				v.decoration.context.usingList.length
					? ` <b>using</b> ${v.decoration.context.usingList.map(u => u.name).join(', ')}`
					: ''
			}</p>`
			+ `<div class="math">${this.ktx(v.toTeXString(null, true))}</div>`
	
			+ (
				!v.expr || v.decoration.schemaType == 'axiom' || omitProofExplorer
					? ''
					: '<p class="label"><b>proof explorer</b></p>'
						+ (
							expandProofExplorer
								? `<p>${this.program.getProofExplorer(k, this.ktx, this.m42kup)}</p>`
								: `<p><input type="button" value="show" class="colored button-expand-proof" onclick="this.parentElement.innerHTML = Globals.program.getProofExplorer('${k}', ktx, m42kup);Globals.expansionList.push('${k}');"></p>`
						)
			)
	
			+ (
				v.decoration.doc
				? '<p class="label"><b>description</b></p>'
					+ `<p class="description">${this.m42kup.render(v.decoration.doc)}</p>`
				: ''
			)
	
			+ `</div>`;
	}
	
	public generate(filename: string, expansionList: string[], includeImports: boolean) {
		var precedenceMap: Map<string, string[]> = new Map();
	
		var primitiveTypeList = [],
			macroTypeList = [],
			primitiveDefinitionList = [],
			macroDefinitionList = [],
			axiomSchemaList = [],
			notProvedList = [],
			provedList = [];
	
		var printThisScope = (scope: Scope) => {
			var map: {[k: number]: string} = {};
	
			for (let [k, v] of scope.defMap) {
				if (!('precedence' in v.decoration) || !v.decoration.precedence) continue;
	
				var prec = v.decoration.precedence.toString();
				
				if (precedenceMap.has(prec)) {
					precedenceMap.set(prec, precedenceMap.get(prec).concat([k]));
				} else {
					precedenceMap.set(prec, [k]);
				}
			}
	
			primitiveTypeList = primitiveTypeList.concat(
				[...scope.typedefMap]
					.filter(([k, v]) => !v.expr).map(([k, v]) => k)
			);
	
			macroTypeList = macroTypeList.concat(
				[...scope.typedefMap]
					.filter(([k, v]) => v.expr).map(([k, v]) => k)
			);
	
			primitiveDefinitionList = primitiveDefinitionList.concat(
				[...scope.defMap]
					.filter(([k, v]) => !v.expr).map(([k, v]) => k)
			);
	
			macroDefinitionList = macroDefinitionList.concat(
				[...scope.defMap]
					.filter(([k, v]) => v.expr).map(([k, v]) => k)
			);
			
			axiomSchemaList = axiomSchemaList.concat(
				[...scope.schemaMap]
					.filter(([k, v]) => v.decoration instanceof SchemaDecoration && v.decoration.schemaType == 'axiom').map(([k, v]) => k)
			);
	
			notProvedList = notProvedList.concat(
				[...scope.schemaMap]
					.filter(([k, v]) => !Calculus.isProved(v)).map(([k, v]) => k)
			);
	
			provedList = provedList.concat(
				[...scope.schemaMap]
					.filter(([k, v]) => v.decoration instanceof SchemaDecoration && v.decoration.schemaType != 'axiom' && Calculus.isProved(v)).map(([k, v]) => k)
			);
	
			for (let [k, v] of scope.typedefMap) {
				map[v._id] = this.typedef(k, v);
			}
	
			for (let [k, v] of scope.defMap) {
				map[v._id] = this.def(k, v);
			}
	
			for (let [k, v] of scope.schemaMap) {
				map[v._id] = this.schema(k, v, expansionList.includes(k), false);
			}
	
			return `<h3 class="label">${scope.fileUri} (${Object.keys(map).length})</h3><div class="block-file">`
				+ Object.keys(map).sort((l, r) => Number(l) - Number(r)).map(k => map[k]).join('')
				+ '</div>';
		};
	
		var visitedFiles = [filename];
	
		function printImportedScopes(scope: Scope) {
			var ret = '';
	
			for (var [k, s] of scope.importMap) {
				if (visitedFiles.includes(k)) continue;
				visitedFiles.push(k);
	
				ret += printImportedScopes(s);
				ret += printThisScope(s);
			}
	
			return ret;
		}

		var all = '';
		
		if (includeImports) {
			all += printImportedScopes(this.program.scope);
		}
		
		all += printThisScope(this.program.scope);
	
		var precedenceTable = [...precedenceMap].sort((a, b) => Number(a[0]) - Number(b[0]));
	
		var ret = {
			'#precedence': `
<p>현재 연산자 우선순위는 다음과 같습니다.</p>

<table>
	<tr><th>우선순위</th><th>연산자</th></tr>
	${precedenceTable.map(([k, v]) => {
		return `<tr><td>${k}</td><td>${v.map(w => {
			return `<a href="#def-${w}">${w}</a>`;
		}).join(', ')}</td></tr>`;
	}).join('')}
</table>

<p>위 표는 자동으로 생성되었습니다.</p>`,
			'#summary': `
<ul>
	<li><p><b>타입</b>(${primitiveTypeList.length + macroTypeList.length})</p>
	<ul>
		<li><b>원시 타입</b>(${primitiveTypeList.length}): ${
			primitiveTypeList.map(n => `<a href="#type-${n}">${n}</a>`).join(', ')
		}
		<li><b>매크로</b>(${macroTypeList.length}): ${
			macroTypeList.map(n => `<a href="#type-${n}">${n}</a>`).join(', ')
		}
	</ul>

	<li><p><b>용어</b>(${primitiveDefinitionList.length + macroDefinitionList.length})</p>
	<ul>
		<li><b>무정의용어</b>(${primitiveDefinitionList.length}): ${
			primitiveDefinitionList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
		<li><b>매크로</b>(${macroDefinitionList.length}): ${
			macroDefinitionList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
	</ul>
	
	<li><p><b>스키마</b>(${axiomSchemaList.length + notProvedList.length + provedList.length})</p>
	<ul>
		<li><b>공리</b>(${axiomSchemaList.length}): ${
			axiomSchemaList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
		<li><b>증명되지 않음</b>(${notProvedList.length}): ${
			notProvedList.map(n => `<a href="#def-${n}">${n}</a>`).join(', ')
		}
		<li><b>정리</b>(${provedList.length})
	</ul>
</ul>`,
			'#all': all
		};

		return ret;
	}
}