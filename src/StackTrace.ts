import InterpolativeError from "./util/InterpolativeError";
import InterpolativeString from "./util/InterpolativeString";
import { LocationObject } from "./PegInterfaceDefinitions";

interface StackTraceElement {
	type: string;
	name: string | null;
	location: LocationObject;
}

export default class StackTrace {

	public readonly fileUri: string | null;
	public readonly stack: StackTraceElement[];

	constructor (fileUri: string | null, stack?: StackTraceElement[]) {
		this.fileUri = fileUri;
		this.stack = stack || [];
	}

	public extend(element: StackTraceElement): StackTrace {
		return new StackTrace(this.fileUri, [element].concat(this.stack));
	}

	public error(message: string | InterpolativeString) {
		var fileUri = this.fileUri || '<unknown>';

		var tail = '\n\tat ';

		if (this.stack.length == 0) {
			tail += `<root> (${fileUri}:1:1)`;
		} else {
			tail += this.stack.map(({type, name, location}) => {
				return `${type} ${name || '<anonymous>'} (${fileUri}:${location.start.line}:${location.start.column})`;
			}).join('\n\tat ');
		}
		
		if (message instanceof InterpolativeString) {
			return new InterpolativeError(message.concatStrings(tail));
		} else {
			return new Error(message + tail);
		}
	}
}