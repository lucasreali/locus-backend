import { z } from "zod";
import { createdAt, id, updatedAt, userId } from "@/shared/dtos";

export const aiResponse = z.object({
	id,
	userId,
	fileName: z.string(),
	documentType: z.string().nullable().optional(),
	status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
	errorMessage: z.string().nullable().optional(),
	courseName: z.string().nullable().optional(),
	professor: z.string().nullable().optional(),
	createdAt,
	updatedAt,
});

export const listAiResponse = z.array(aiResponse);

export const aiParams = z.object({
	aiId: id,
});

export const uploadResponse = z.object({
	id,
	message: z.string(),
});

export const createAiSchema = z.object({
	userId,
	fileName: z.string(),
	status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
});

export type aiResponseStatic = z.infer<typeof aiResponse>;
export type listAiResponseStatic = z.infer<typeof listAiResponse>;
export type aiParamsStatic = z.infer<typeof aiParams>;
export type uploadResponseStatic = z.infer<typeof uploadResponse>;
export type createAiSchemaStatic = z.infer<typeof createAiSchema>;
