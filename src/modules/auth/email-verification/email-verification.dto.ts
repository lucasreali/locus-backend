import { z } from "zod";

export const verifyEmailQuery = z.object({
	token: z.string().min(1),
});

export const resendEmailRequest = z.object({
	email: z.email(),
});
