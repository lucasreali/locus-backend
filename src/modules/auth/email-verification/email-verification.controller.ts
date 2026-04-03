import { z } from "zod";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import type { FastifyTypeInstance } from "@/types";
import { resendEmailRequest, verifyEmailQuery } from "./email-verification.dto";
import { emailVerificationService } from "./email-verification.service";

export const emailVerificationController = (app: FastifyTypeInstance) => {
	app.get(
		"/verify-email",
		{
			config: {
				rateLimit: RATE_LIMITS.EMAIL,
			},
			schema: {
				tags: ["auth"],
				description: "Verify email address",
				querystring: verifyEmailQuery,
				response: {
					200: z.object({ message: z.string() }),
				},
			},
		},
		async (req, rep) => {
			const { token } = req.query;
			const result = await emailVerificationService.verifyEmail(token);
			return rep.status(200).send(result);
		},
	);

	app.post(
		"/resend-verification",
		{
			config: {
				rateLimit: RATE_LIMITS.EMAIL,
			},
			schema: {
				tags: ["auth"],
				description: "Resend verification email",
				body: resendEmailRequest,
				response: {
					200: z.object({ message: z.string() }),
				},
			},
		},
		async (req, rep) => {
			const { email } = req.body;
			const result =
				await emailVerificationService.resendVerificationEmail(email);
			return rep.status(200).send(result);
		},
	);
};
