import Variable from "./expr/Variable";

export default class ExecutionContext {

	public readonly usingList: Variable[];

	constructor (usingList?: Variable[]) {
		this.usingList = usingList || [];
	}

	public canUse(variable: Variable) {
		return this.usingList.includes(variable);
	}
}