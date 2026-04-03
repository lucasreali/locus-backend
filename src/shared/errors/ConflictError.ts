import { BasicError } from "./BasicError";

export class ConflictError extends BasicError {
	constructor(message: string = "Conflict") {
		super(message, 409);
	}
}
