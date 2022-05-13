import ObjectFun from "./expr/ObjectFun";
import Variable from "./expr/Variable";

export default class ExecutionContext {

	public readonly usingList: (Variable | ObjectFun)[];

	constructor (usingList?: (Variable | ObjectFun)[]) {
		this.usingList = usingList || [];
	}

	public canUse(fun: Variable | ObjectFun) {
		return this.usingList.includes(fun);
	}
}