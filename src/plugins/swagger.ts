import fastifySwagger from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import type { FastifyTypeInstance } from "../types";

export const swaggerFp = fp(async (app: FastifyTypeInstance) => {
	app.register(fastifySwagger, {
		openapi: {
			info: { title: "Locus", version: "0.0.1" },
			security: [{ BearerAuth: [] }],
			components: {
				securitySchemes: {
					BearerAuth: {
						type: "http",
						scheme: "bearer",
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
