import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { BasicError } from "../errors/BasicError";
import { ForbiddenError } from "../errors/ForbiddenError";

export const errorHandler = (
	error: FastifyError,
	req: FastifyRequest,
	rep: FastifyReply,
) => {
	req.log.error(error);

	if (error instanceof ForbiddenError) {
		return rep.status(403).send({
			error: "Forbidden",
			message: error.message,
		});
	}

	if (error instanceof BasicError) {
		return rep.status(error.statusCode).send({
			message: error.message,
		});
	}

	if (error.validation) {
		return rep.status(422).send({
			message: "Validation failed",
		});
	}

	return rep.status(500).send({
		message: "Internal server error",
	});
};
