import { z } from "zod";
import { userResponse } from "@/modules/user/user.dto";
import { email, id, name, password, avatarUrl, createdAt, updatedAt } from "@/shared/dtos";

export const authLoginRequest = z.object({
	email: email,
	password: password,
});

export const authLoginResponse = z.object({
	user: userResponse,
	sessionId: z.string(),
});

export const authValidateResponse = z.object({
	id,
	name,
	email,
	avatarUrl,
	createdAt,
	updatedAt
});

export type authLoginRequestStatic = z.infer<typeof authLoginRequest>;
