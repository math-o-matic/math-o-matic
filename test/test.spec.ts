import chai, { expect } from "chai";
import ExecutionContext from "../src/ExecutionContext";
import Calculus from "../src/Calculus";
chai.use(require('chai-as-promised'));
import Expr from "../src/expr/Expr";
import ObjectFun from "../src/expr/ObjectFun";
import Precedence from "../src/Precedence";
import Program from '../src/Program';
var fs = require('fs');
var path = require('path');

import unparse from '../src/Unparser';
import FunctionalAtomicDecoration from "../src/decoration/FunctionalAtomicDecoration";

function removeLocationAndStringify(obj: any) {
	return JSON.stringify(obj, (k, v) => {
		if (k == 'location') return undefined;
		return v;
	}, 2);
}

describe('Unparser', function () {
	[
		'propositional', 'predicate', 'set',
		'relation', 'function', 'natural',
		'algebra', 'integer'
	].forEach(name => {
		it(`can unparse ${name}.math`, async function () {
            var o = fs.readFileSync(path.join(__dirname, '../math/' + name + '.math'), 'utf-8');
			var parsed = Program.parser.parse(o);
			var parsed_unparsed_parsed = Program.parser.parse(unparse(parsed));
			
			expect(removeLocationAndStringify(parsed) == removeLocationAndStringify(parsed_unparsed_parsed)).to.be.true;
		});
	});
});

describe('Program', function () {
	var program = new Program();

	[
		'propositional', 'predicate', 'set',
		'relation', 'function', 'natural',
		'algebra', 'integer'
	].forEach(name => {
		it(`can load ${name}.math`, async function () {
			await program.loadModule(name, (filename: string) => ({
                fileUri: filename + '.math',
				code: fs.readFileSync(path.join(__dirname, '../math/' + filename + '.math'), 'utf-8')
			}));
		});
	});
});

describe('ObjectFun', function () {
	it('should throw if !rettype && !expr', function () {
		expect(() => new ObjectFun({
			decoration: new FunctionalAtomicDecoration({
				doc: null,
				precedence: Precedence.ZERO,
				tex: null
			}),
			rettype: null,
			name: null,
			params: [],
			expr: null
		}, null)).to.throw();
	});
});

describe('Issue #52', function () {
	it('(f(x))(y) == (f(x))(y)', async function () {
		var program = new Program();

		await program.loadModule('duh', (_filename: string) => ({
			code: `
type cls;

[cls -> [cls -> cls]] f;
cls x;
cls y;
`
		}));
		var foo = program.evaluate('(f(x))(y)') as Expr,
			baz = program.evaluate('(f(x))(y)') as Expr;
		
		expect(!!Calculus.equals(foo, baz, null)).to.be.true;
	});
});

describe('Sealed macro & using', function () {
	it('N(p) != (sealed p => N(p))', async function () {
		var program = new Program();
		
		await program.loadModule('duh', (_filename: string) => ({
			code: `
type st;

st p;

st N(st p);

sealed st N2(st p) {
	N(p)
}
`
		}));
		var foo = program.evaluate('N(p)') as Expr,
			baz = program.evaluate('N2(p)') as Expr;
		
		expect(Calculus.equals(foo, baz, new ExecutionContext())).to.be.false;
	});

	for (let i = 0; i < 2; i++) {
		it(`Issue #53.${i + 1}`, async function () {
			var program = new Program();
			
			await expect(program.loadModule('duh', (_filename: string) => ({
				code: `
type st;
st p;
st N(st p);

sealed st N2(st p) {
	N(p)
}

schema foo(st p) using N2 {
	N2(p) |- p
}

schema bar(st p) ${i == 0 ? '' : 'using N2'} {
	N(p) |- {
        @h1 > foo(p)
    }
}
`
			}))).to.be[i == 0 ? 'rejected' : 'fulfilled'];
		});
	}
});