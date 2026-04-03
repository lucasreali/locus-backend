import fastifySwagger from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import type { FastifyTypeInstance } from "../types";

export const swaggerFp = fp(async (app: FastifyTypeInstance) => {
	app.register(fastifySwagger, {
		openapi: {
			info: { title: "Helix", version: "0.0.1" },
			security: [{ CookieAuth: [] }],
			components: {
				securitySchemes: {
					CookieAuth: {
						type: "apiKey",
						in: "cookie",
						name: "sessionToken",
					},
				},
			},
		},
		transform: jsonSchemaTransform,
	});

	app.register(fastifySwaggerUi, {
		routePrefix: "/docs",
	});
});
