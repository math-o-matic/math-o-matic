import Expr from "./expr/Expr";
import Parameter from "./expr/Parameter";
import Variable from "./expr/Variable";

export type ProofType = R | SE | RC | RS | H | NP | T | V | TE | Def | ByDef;

/** repeat */
interface R {
	_type: 'R';
	ctr: number;
	num: number | [number, number];
	expr: Expr;
}

interface SE {
	_type: 'SE';
	ctr: number;
	schema: number | [number, number];
	args: Expr[];
	expr: Expr;
}

interface RC {
	_type: 'RC';
	ctr: number;
	expr: Expr;
}

interface RS {
	_type: 'RS';
	ctr: number;
	expr: Expr;
}

/** hypothesis */
interface H {
	_type : 'H';
	ctr: number;
	expr: Expr;
}

/** not proved */
interface NP {
	_type: 'NP';
	ctr: number;
	expr: Expr;
}

interface T {
	_type: 'T';
	ctr: [number, number];
	leftlines: H[];
	rightlines: ProofType[];
}

interface V {
	_type: 'V';
	ctr: [number, number];
	$lines: ProofType[];
	lines: ProofType[];
	params: Parameter[];
}

interface TE {
	_type: 'TE';
	ctr: number;
	subject: number | [number, number] | Expr;
	args: Expr[] | null;
	antecedents: (number | [number, number])[];
	reduced: Expr;
}

interface Def {
	_type: 'def';
	ctr: number;
	var: Variable;
}

interface ByDef {
	_type: 'bydef';
	ctr: number;
	ref: number | [number, number];
	expr: Expr;
	of: Variable[];
}