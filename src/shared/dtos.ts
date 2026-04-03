import z from "zod";

export const id = z.uuidv7();
export const userId = z.uuidv7();

export const name = z.string().min(1, "Name is required").max(100);
export const email = z.email("Invalid email format");
export const password = z
	.string()
	.min(4, "Password must be at least 4 characters");
export const url = z.url("Invalid URL format");
export const avatarUrl = z.url().nullable().optional();

export const accessToken = z.string().min(1);
export const oAuthCode = z.string().min(1);

export const createdAt = z.coerce.date();
export const updatedAt = z.coerce.date();

export const error = z.object({
	message: z.string(),
	code: z.string(),
});

export const userParams = z.object({
	userId: userId,
});

export const urlResponse = z.object({
	url: url,
});

export const messageResponse = z.object({
	message: z.string(),
});

export const noContentResponse = z.null();

export type IdType = z.infer<typeof id>;
export type UserIdType = z.infer<typeof userId>;
export type NameType = z.infer<typeof name>;
export type EmailType = z.infer<typeof email>;
export type PasswordType = z.infer<typeof password>;
export type UrlType = z.infer<typeof url>;
export type AvatarUrlType = z.infer<typeof avatarUrl>;
export type AccessTokenType = z.infer<typeof accessToken>;
export type OAuthCodeType = z.infer<typeof oAuthCode>;
export type CreatedAtType = z.infer<typeof createdAt>;
export type UpdatedAtType = z.infer<typeof updatedAt>;

export type UserParamsType = z.infer<typeof userParams>;
export type UrlResponseType = z.infer<typeof urlResponse>;
export type MessageResponseType = z.infer<typeof messageResponse>;
