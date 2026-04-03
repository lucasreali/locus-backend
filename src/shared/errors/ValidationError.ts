import { BasicError } from "./BasicError";

export class ValidationError extends BasicError {
	constructor(message: string = "Validation failed") {
		super(message, 422);
	}
}
