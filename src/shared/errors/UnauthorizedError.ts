import { BasicError } from "./BasicError";

export class UnauthorizedError extends BasicError {
	constructor(message: string = "Unauthorized") {
		super(message, 401);
	}
}
