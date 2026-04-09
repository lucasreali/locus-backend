import { z } from "zod";
import { createdAt, id, name, updatedAt, userId } from "@/shared/dtos";



export const subjectRequest = z.object({
	name,
	icon: z.string(),
});

export const subjectUpdateRequest = z.object({
	name: name.optional(),
	icon: z.string().optional(),
});

export const subjectResponse = z.object({
	id,
	userId,
	name,
	icon: z.string(),
	createdAt,
	updatedAt,
});

export const listSubjectResponse = z.array(subjectResponse);

export const subjectWithNotesResponse = z.array(
	subjectResponse.extend({
		notes: z.array(
			z.object({
				id,
				userId,
				subjectId: id.nullable(),
				title: z.string(),
				content: z.string(),
				createdAt,
				updatedAt,
			}),
		),
	}),
);

export const subjectParams = z.object({
	subjectId: id,
});

export const createSubjectSchema = z.object({
	id,
	userId,
	name,
	icon: z.string(),
	createdAt,
	updatedAt,
});

export type subjectRequestStatic = z.infer<typeof subjectRequest>;
export type subjectUpdateRequestStatic = z.infer<typeof subjectUpdateRequest>;
export type subjectResponseStatic = z.infer<typeof subjectResponse>;
export type listSubjectResponseStatic = z.infer<typeof listSubjectResponse>;
export type subjectParamsStatic = z.infer<typeof subjectParams>;
export type createSubjectSchemaStatic = z.infer<typeof createSubjectSchema>;
export type subjectWithNotesResponseStatic = z.infer<
	typeof subjectWithNotesResponse
>;
