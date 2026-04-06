import { z } from 'zod';
import { createdAt, id, updatedAt, userId } from '@/shared/dtos';

export const syllabusResponse = z.object({
	id,
	userId,
	fileName: z.string(),
	documentType: z.string().nullable().optional(),
	status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
	errorMessage: z.string().nullable().optional(),
	courseName: z.string().nullable().optional(),
	professor: z.string().nullable().optional(),
	createdAt,
	updatedAt,
});

export const listSyllabusResponse = z.array(syllabusResponse);

export const syllabusParams = z.object({
	syllabusId: id,
});

export const uploadResponse = z.object({
	id,
	message: z.string(),
});

export const createSyllabusSchema = z.object({
	userId,
	fileName: z.string(),
	status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
});

export type syllabusResponseStatic = z.infer<typeof syllabusResponse>;
export type listSyllabusResponseStatic = z.infer<typeof listSyllabusResponse>;
export type syllabusParamsStatic = z.infer<typeof syllabusParams>;
export type uploadResponseStatic = z.infer<typeof uploadResponse>;
export type createSyllabusSchemaStatic = z.infer<typeof createSyllabusSchema>;
