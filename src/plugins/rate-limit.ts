import { env } from "@/config/env";
import { redis } from "@/database/redis";
import fastifyRateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";
import type { FastifyTypeInstance } from "../types";

export const rateLimitFp = fp(async (app: FastifyTypeInstance) => {
	if (env.NODE_ENV === "test") {
		return;
	}

	await app.register(fastifyRateLimit, {
		global: false,
		redis: redis,
		nameSpace: "locus-rate-limit:",
		skipOnError: false,
	});
});

export const RATE_LIMITS = {
	AUTH_STRICT: {
		max: 5,
		timeWindow: "15 minutes",
		errorResponseBuilder: () => ({
			statusCode: 429,
			error: "Too Many Requests",
			message: "Too many attempts. Please try again in 15 minutes.",
		}),
	},

	EMAIL: {
		max: 3,
		timeWindow: "1 hour",
		errorResponseBuilder: () => ({
			statusCode: 429,
			error: "Too Many Requests",
			message: "Email limit reached. Please try again in 1 hour.",
		}),
	},

	WRITE: {
		max: 20,
		timeWindow: "1 minute",
	},

	READ: {
		max: 100,
		timeWindow: "1 minute",
	},
};
