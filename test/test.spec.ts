import chai, { expect } from "chai";
import ExecutionContext from "../src/ExecutionContext";
import Calculus from "../src/Calculus";
chai.use(require('chai-as-promised'));
import Expr from "../src/expr/Expr";
import Program from '../src/Program';
var fs = require('fs');
var path = require('path');
var glob = require('glob');

import unparse from '../src/Unparser';

function removeLocationAndStringify(obj: any) {
	return JSON.stringify(obj, (k, v) => {
		if (k == 'location') return undefined;
		return v;
	}, 2);
}

var fqns: string[] = glob.sync('**/*.math', {cwd: 'math'}).map((filename: string) => {
	return filename.replace(/\//g, '.').replace(/\.math$/, '');
});

describe('Unparser', function () {
	fqns.forEach(fqn => {
		it(`can unparse ${fqn}`, async function () {
            var o = fs.readFileSync(path.join(__dirname, '../math/' + fqn.replace(/\./g, '/') + '.math'), 'utf-8');
			var parsed = Program.parser.parse(o);
			var parsed_unparsed_parsed = Program.parser.parse(unparse(parsed));
			
			expect(removeLocationAndStringify(parsed_unparsed_parsed)).to.equal(removeLocationAndStringify(parsed));
		});
	});
});

describe('Program', function () {
	var program = new Program();

	fqns.forEach(fqn => {
		it(`can load ${fqn}`, async function () {
			await program.loadSystem(fqn, (fqn: string) => ({
                fileUri: 'math/' + fqn.replace(/\./g, '/') + '.math',
				code: fs.readFileSync(path.join(__dirname, '../math/' + fqn.replace(/\./g, '/') + '.math'), 'utf-8')
			}));
		});
	});
});

describe('Issue #52', function () {
	it('(f(x))(y) == (f(x))(y)', async function () {
		var program = new Program();

		await program.loadSystem('duh', (_fqn: string) => ({
			code: `
system duh {
	type cls;

	[cls -> [cls -> cls]] f;
	cls x;
	cls y;
}
`
		}));
		var foo = program.evaluate('(f(x))(y)') as Expr,
			baz = program.evaluate('(f(x))(y)') as Expr;
		
		expect(!!Calculus.equals(foo, baz, new ExecutionContext())).to.be.true;
	});
});

describe('Sealed macro & using', function () {
	it('N(p) != (sealed p => N(p))', async function () {
		var program = new Program();
		
		await program.loadSystem('duh', (_fqn: string) => ({
			code: `
system duh {
	type st;

	st p;

	st N(st p);

	st N2(st p) {
		N(p)
	}
}
`
		}));
		var foo = program.evaluate('N(p)') as Expr,
			baz = program.evaluate('N2(p)') as Expr;
		
		expect(Calculus.equals(foo, baz, new ExecutionContext())).to.be.false;
	});

	for (let i = 0; i < 2; i++) {
		it(`Issue #53 (${i + 1})`, async function () {
			var program = new Program();
			
			await expect(program.loadSystem('duh', (_fqn: string) => ({
				code: `
system duh {
	type st;
	st p;
	st N(st p);

	st N2(st p) {
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
}
`
			}))).to.be[i == 0 ? 'rejected' : 'fulfilled'];
		});
	}
});