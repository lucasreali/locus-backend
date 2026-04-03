import cookie from "@fastify/cookie";
import fp from "fastify-plugin";
import { env } from "@/config/env";
import type { FastifyTypeInstance } from "@/types";

export const cookiesFp = fp(async (app: FastifyTypeInstance) => {
	app.register(cookie, {
		secret: env.COOKIE_SECRET,
		hook: "onRequest",
	});
});
