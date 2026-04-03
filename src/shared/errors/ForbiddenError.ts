import { BasicError } from "./BasicError";

export class ForbiddenError extends BasicError {
	constructor(
		message: string = "You do not have permission to access this resource",
	) {
		super(message, 403);
	}
}
