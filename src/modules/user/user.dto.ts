import { z } from "zod";
import {
	avatarUrl,
	createdAt,
	email,
	id,
	name,
	password,
	userParams as sharedUserParams,
	updatedAt,
} from "@/shared/dtos";

export const userRequest = z.object({
	name,
	email,
	password,
});

export const userUpdateRequest = z.object({
	name: name.optional(),
	email: email.optional(),
	avatarUrl: avatarUrl.optional(),
});

export const userResponse = z.object({
	id,
	name,
	email,
	avatarUrl,
	createdAt,
	updatedAt,
});

export const listUserResponse = z.array(userResponse);

export const userParams = sharedUserParams;

export const createUserSchema = z.object({
	id,
	name,
	email,
	avatarUrl,
	createdAt,
	updatedAt,
});

export type userRequestStatic = z.infer<typeof userRequest>;
export type userUpdateRequestStatic = z.infer<typeof userUpdateRequest>;
export type userResponseStatic = z.infer<typeof userResponse>;
export type listUserResponseStatic = z.infer<typeof listUserResponse>;
export type userParamsStatic = z.infer<typeof userParams>;
export type createUserSchemaStatic = z.infer<typeof createUserSchema>;
