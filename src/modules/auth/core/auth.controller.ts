import { RATE_LIMITS } from "@/plugins/rate-limit";
import { noContentResponse } from "@/shared/dtos";
import { authHandler } from "@/shared/middlewares/auth-handler";
import { getCookieConfig } from "@/shared/utils/cookie-config";
import type { FastifyTypeInstance } from "@/types";
import {
	authLoginRequest,
	authLoginResponse,
	authValidateResponse,
} from "./auth.dto";
import { authService } from "./auth.service";

export const authController = (app: FastifyTypeInstance) => {
	app.post(
		"/login",
		{
			config: {
				rateLimit: RATE_LIMITS.AUTH_STRICT,
			},
			schema: {
				tags: ["auth"],
				body: authLoginRequest,
				response: {
					200: authLoginResponse,
				},
			},
		},
		async (req, rep) => {
			const credentials = req.body;
			const data = await authService.login(credentials);

			rep.setCookie("sessionToken", data.sessionId, getCookieConfig());

			return rep.status(200).send({ user: data.user });
		},
	);

	app.get(
		"/validate",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				tags: ["auth"],
				description: "Validate user authentication",
				response: {
					200: authValidateResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;

			return rep.status(200).send({ id });
		},
	);

	app.post(
		"/logout",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.AUTH_STRICT,
			},
			schema: {
				tags: ["auth"],
				description: "Logout current session",
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const sessionToken = req.cookies.sessionToken;

			if (sessionToken) {
				await authService.logout(sessionToken);
			}

			rep.clearCookie("sessionToken", getCookieConfig());

			return rep.status(204).send(null);
		},
	);
};
