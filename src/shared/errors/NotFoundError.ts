import { BasicError } from "./BasicError";

export class NotFoundError extends BasicError {
	constructor(message: string = "Resource not found") {
		super(message, 404);
	}
}
