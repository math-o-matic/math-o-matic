import InterpolativeString from "./InterpolativeString";

export default class InterpolativeError extends Error {
	public interpolativeMessage: InterpolativeString;

	constructor (message: InterpolativeString) {
		super(message.toString());
		this.interpolativeMessage = message;
	}
}