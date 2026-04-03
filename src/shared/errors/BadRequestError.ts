import { BasicError } from "./BasicError";

export class BadRequestError extends BasicError {
	constructor(message: string = "Bad request") {
		super(message, 400);
	}
}
