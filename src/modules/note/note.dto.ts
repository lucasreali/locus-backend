import { z } from "zod";
import { createdAt, id, updatedAt, userId } from "@/shared/dtos";

export const noteRequest = z.object({
	title: z.string().min(1).max(255),
	content: z.string().min(1).max(500000),
	subjectId: id.nullable().optional(),
});

export const noteUpdateRequest = noteRequest.partial();

export const noteResponse = noteRequest.extend({
	id,
	userId,
	subjectId: id.nullable().optional(),
	createdAt,
	updatedAt,
});

export const listNoteResponse = z.array(noteResponse);

export const noteParams = z.object({
	noteId: id,
});

export const noteQueryParams = z.object({
	subjectId: id.optional(),
	search: z.string().max(100).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
});

export const subjectInfo = z.object({
	id,
	name: z.string(),
	color: z.string(),
});

export const notesBySubjectItem = z.object({
	subject: subjectInfo.nullable(),
	notes: z.array(noteResponse),
});

export const notesBySubjectResponse = z.array(notesBySubjectItem);

export const createNoteSchema = noteResponse;

export type noteRequestStatic = z.infer<typeof noteRequest>;
export type noteUpdateRequestStatic = z.infer<typeof noteUpdateRequest>;
export type noteResponseStatic = z.infer<typeof noteResponse>;
export type listNoteResponseStatic = z.infer<typeof listNoteResponse>;
export type noteParamsStatic = z.infer<typeof noteParams>;
export type noteQueryParamsStatic = z.infer<typeof noteQueryParams>;
export type createNoteSchemaStatic = z.infer<typeof createNoteSchema>;
export type notesBySubjectItemStatic = z.infer<typeof notesBySubjectItem>;
export type notesBySubjectResponseStatic = z.infer<
	typeof notesBySubjectResponse
>;
