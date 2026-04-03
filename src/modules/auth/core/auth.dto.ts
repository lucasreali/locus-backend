import { z } from "zod";
import { userResponse } from "@/modules/user/user.dto";
import { email, id, password } from "@/shared/dtos";

export const authLoginRequest = z.object({
	email: email,
	password: password,
});

export const authLoginResponse = z.object({
	user: userResponse,
});

export const authValidateResponse = z.object({
	id: id,
});



export type authLoginRequestStatic = z.infer<typeof authLoginRequest>;

