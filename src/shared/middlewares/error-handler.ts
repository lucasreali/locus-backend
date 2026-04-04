import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { BasicError } from "../errors/BasicError";

export const errorHandler = (
	error: FastifyError,
	req: FastifyRequest,
	rep: FastifyReply,
) => {
	if (error instanceof BasicError) {
		req.log.warn({ err: error.message, statusCode: error.statusCode });
		return rep.status(error.statusCode).send({
			message: error.message,
		});
	}

	if (error.validation) {
		req.log.warn({ validation: error.validation });
		return rep.status(422).send({
			message: "Validation failed",
			errors: error.validation,
		});
	}

	req.log.error(error);
	return rep.status(500).send({
		message: "Internal server error",
	});
};
