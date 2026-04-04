import { fastify } from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { cookiesFp } from "./plugins/cookies";
import { corsFp } from "./plugins/cors";
import { multipartFp } from "./plugins/multipart";
import { rateLimitFp } from "./plugins/rate-limit";
import { swaggerFp } from "./plugins/swagger";
import { routes } from "./routes";
import { errorHandler } from "./shared/middlewares/error-handler";

export const build = () => {
	const app = fastify({
		logger: process.env.NODE_ENV === "test",
	}).withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.setErrorHandler(errorHandler);

	app.register(corsFp);
	app.register(multipartFp);
	app.register(rateLimitFp);
	app.register(swaggerFp);
	app.register(cookiesFp);

	app.register(routes);

	return app;
};
