import ExecutionContext from "../ExecutionContext";
import { SchemaType } from "../expr/Fun";
import Precedence from "../Precedence";
import FunctionalMacroDecoration from "./FunctionalMacroDecoration";

export default class SchemaDecoration extends FunctionalMacroDecoration {
	
	public schemaType: SchemaType;
	public context: ExecutionContext;

	constructor ({doc, schemaType, context} : {
		doc: string,
		schemaType: SchemaType,
		context: ExecutionContext
	}) {
		
		super({
			doc,
			precedence: Precedence.ZERO,
			tex: null,
			sealed: false
		});

		this.schemaType = schemaType;
		this.context = context;
	}
}