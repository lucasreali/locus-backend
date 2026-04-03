import { createdAt, id, name, updatedAt, userId } from "@/shared/dtos";
import { z } from "zod";

export const color = z
	.string()
	.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid HEX color");

export const subjectRequest = z.object({
	name,
	color,
});

export const subjectUpdateRequest = z.object({
	name: name.optional(),
	color: color.optional(),
});

export const subjectResponse = z.object({
	id,
	userId,
	name,
	color,
	createdAt,
	updatedAt,
});

export const listSubjectResponse = z.array(subjectResponse);

export const subjectParams = z.object({
	subjectId: id,
});

export const createSubjectSchema = z.object({
	id,
	userId,
	name,
	color,
	createdAt,
	updatedAt,
});

export type ColorStatic = z.infer<typeof color>;
export type subjectRequestStatic = z.infer<typeof subjectRequest>;
export type subjectUpdateRequestStatic = z.infer<typeof subjectUpdateRequest>;
export type subjectResponseStatic = z.infer<typeof subjectResponse>;
export type listSubjectResponseStatic = z.infer<typeof listSubjectResponse>;
export type subjectParamsStatic = z.infer<typeof subjectParams>;
export type createSubjectSchemaStatic = z.infer<typeof createSubjectSchema>;
