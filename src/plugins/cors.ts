import fastifyCors from "@fastify/cors";
import fp from "fastify-plugin";
import { env } from "@/config/env";
import type { FastifyTypeInstance } from "@/types";

export const corsFp = fp(async (app: FastifyTypeInstance) => {
	await app.register(fastifyCors, {
		origin: env.FRONTEND_URL,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE"],
	});
});
