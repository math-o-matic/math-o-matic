import Program from '../../../src/Program';
import SystemScope from '../../../src/scope/SystemScope';
import HtmlGenerator from '../../../src/HtmlGenerator';
var yamd = require('yamd');
var katex = require('katex');

// @ts-ignore
CodeMirror.keyMap.sublime['Shift-Ctrl-Enter'] = null;
// @ts-ignore
CodeMirror.keyMap.sublime['Ctrl-L'] = null;

yamd.set({
	tags: {
		'#': new yamd.renderer.Tag({
			name: '#',
			display: 'inline',
			renderer: (el: any, options: any) => {
				if (!el.innerIsText)
					return el.error('Non-text input');
				
				var html = '';

				try {
					html = Globals.ktx(Globals.program!.evaluate(el.innerText).toTeXString());
				} catch (e) {
					return el.error((e as Error).message);
				}
				
				return el.html(html);
			}
		})
	},
	katex
});

const ktx = (() => {
	var katexOptions = {
		trust: (context: any) => {
			if (context.command == '\\href'
					&& context.protocol == '_relative')
				return true;
			
			if (['\\htmlId', '\\htmlData'].includes(context.command))
				return true;
			
			return false;
		},
		strict: (errorCode: any, errorMsg: any, token: any) => {
			if (errorCode == 'htmlExtension') return 'ignore';
			return 'warn';
		}
	};

	return (s: string) => {
		var ret = '';
		try {
			ret = katex.renderToString(s, katexOptions);
		} catch (e) {
			console.error(`Error parsing ${s}`);
			throw Error(e as any);
		}

		return ret;
	}
})();

type GlobalsType = {
	program: Program | null,
	reloading: boolean,
	fqn: string | null,
	systempath: any,
	yamd: {render: (s: string) => string},
	ktx: (s: string) => string,
	currentlyLoadedThing: {
		_thing: string | null,
		set: (thing: string) => void,
		get: () => string | null
	},
	searchDatabase: string[],
	updateSearchDatabase: () => void,
	expansionList: string[],
	getFileLoadPreference: () => string,
	onShowButtonClick: (target: HTMLElement) => void,
	reload: (fqn: string) => Promise<void>,
	Popper: any,
	CodeMirror: any,
	hotkeys: any
};

var Globals: GlobalsType = {
	program: null,
	reloading: false,
	fqn: null,
	systempath: null,
	yamd, ktx,
	currentlyLoadedThing: {
		_thing: null,
		set(thing: string) {
			this._thing = thing;
			(document.querySelector('#currently-loaded-thing b') as HTMLElement).innerText = thing;
		},
		get() {
			return this._thing;
		}
	},
	searchDatabase: [],
	updateSearchDatabase() {
		var visitedFiles = [this.fqn];

		var searchDatabase: string[] = [];

		function addThisScope(scope: SystemScope) {
			searchDatabase = searchDatabase
				.concat([...scope.variableMap.keys()]);
		}

		function addImportedScopes(scope: SystemScope) {
			for (var [k, s] of scope.extendsMap) {
				if (visitedFiles.includes(k)) continue;
				visitedFiles.push(k);

				addImportedScopes(s);
				addThisScope(s);
			}
		}

		addImportedScopes(this.program!.scope!);
		addThisScope(this.program!.scope!);

		this.searchDatabase = searchDatabase;
	},
	expansionList: [],
	getFileLoadPreference() {
		return (document.querySelector('input[name="radio-load-what"]:checked') as HTMLInputElement).value;
	},
	onShowButtonClick(target: HTMLElement) {
		var k = target.getAttribute('data-name')!;
		target.parentElement!.innerHTML = Globals.program!.getProofExplorer(k, Globals.ktx, Globals.yamd);
		Globals.expansionList.push(k);
	},
	reload: async function reload(fqn: string) {
		if (!fqn) return;

		if (Globals.reloading) return;
		Globals.reloading = true;
		Globals.fqn = fqn;

		(document.querySelector('#reload') as HTMLInputElement).disabled = true;
		(document.querySelector('#reload svg') as SVGElement).classList.add('rotate');

		try {
			var start: Date, end: Date;

			console.log('--- PROGRAM START ---');
			start = new Date();
			Globals.program = new Program();
			await Globals.program.loadSystem(fqn, async fqn => {
				for (var path of Globals.systempath.paths) {
					try {
						var fileUri = path + fqn.replace(/\./g, '/') + '.math';
						var res = await fetch(fileUri);

						if (!res.ok) continue;

						var code = await res.text();

						return {fileUri, code};
					} catch (e) {
						continue;
					}
				}

				throw Error(`System ${fqn} was not found from paths ${Globals.systempath.paths.join(':')}`);
			});

			Globals.updateSearchDatabase();

			end = new Date();
			console.log(Globals.program);
			console.log('--- PROGRAM END ---');
			console.log(`Program took ${end.getTime() - start.getTime()} ms`);
			console.log('--- HTML GENERATION START ---');
			start = new Date();

			var generator = new HtmlGenerator(Globals.program, Globals.ktx, Globals.yamd);
			var generated: {[key: string]: string} = generator.generate(
				Globals.fqn,
				Globals.expansionList,
				Globals.getFileLoadPreference() == 'selected-file-and-dependencies'
			);

			end = new Date();
			console.log('--- HTML GENERATION END ---');
			console.log(`HTML generation took ${end.getTime() - start.getTime()} ms`);
			console.log('--- HTML RENDER START ---');
			start = new Date();
			
			for (var k in generated) {
				document.querySelector(k)!.innerHTML = generated[k];
			}

			end = new Date();
			console.log('--- HTML RENDER END ---');
			console.log(`HTML render took ${end.getTime() - start.getTime()} ms`);

			Globals.currentlyLoadedThing.set(fqn);
		} finally {
			(document.querySelector('#reload') as HTMLInputElement).disabled = false;
			(document.querySelector('#reload svg') as SVGElement).classList.remove('rotate');
			Globals.reloading = false;
		}
	},
	// @ts-ignore
	Popper, CodeMirror, hotkeys
};

// @ts-ignore
window.Globals = Globals;

export default Globals;