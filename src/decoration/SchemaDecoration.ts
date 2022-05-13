import { SchemaType } from "../expr/Schema";
import Precedence from "../Precedence";
import FunctionalMacroDecoration from "./FunctionalMacroDecoration";

export default class SchemaDecoration extends FunctionalMacroDecoration {
	
	public schemaType: SchemaType;

	constructor ({doc, schemaType} : {
		doc: string,
		schemaType: SchemaType
	}) {
		
		super({
			doc,
			precedence: Precedence.ZERO,
			tex: null,
			sealed: false
		});

		this.schemaType = schemaType;
	}
}