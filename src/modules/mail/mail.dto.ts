import { z } from "zod";

export const mailRequest = z.object({
	to: z.email("Invalid email format"),
	subject: z
		.string()
		.min(1, "Subject is required")
		.max(255, "Subject too long"),
	html: z.string().min(1, "HTML content is required"),
});

export const mailResponse = z.object({
	message: z.string(),
	jobId: z.string().optional(),
});

export const mailTestRequest = mailRequest;

export const mailTestResponse = mailResponse;

export type mailRequestStatic = z.infer<typeof mailRequest>;
export type mailResponseStatic = z.infer<typeof mailResponse>;
export type mailTestRequestStatic = z.infer<typeof mailTestRequest>;
export type mailTestResponseStatic = z.infer<typeof mailTestResponse>;
