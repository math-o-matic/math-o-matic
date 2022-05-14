import Fun from "./expr/Fun";
import Variable from "./expr/Variable";

export default class ExecutionContext {

	public readonly usingList: (Variable | Fun)[];

	constructor (usingList?: (Variable | Fun)[]) {
		this.usingList = usingList || [];
	}

	public canUse(variable: Variable | Fun) {
		return this.usingList.includes(variable);
	}
}