import { createdAt, id, updatedAt, userId } from '@/shared/dtos';
import { z } from 'zod';

export const eventRequest = z.object({
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    type: z.enum(['exam', 'assignment', 'project', 'presentation', 'other']),
    courseName: z.string().nullable().optional(),
    status: z.enum(['pending', 'completed']).default('pending').optional(),
});

export const eventUpdateRequest = eventRequest.partial();

export const eventResponse = eventRequest.extend({
    id,
    userId,
    syllabusId: id.nullable().optional(),
    createdAt,
    updatedAt,
});

export const listEventResponse = z.array(eventResponse);

export const eventParams = z.object({
    eventId: id,
});

export const createEventSchema = eventResponse;

export type eventRequestStatic = z.infer<typeof eventRequest>;
export type eventUpdateRequestStatic = z.infer<typeof eventUpdateRequest>;
export type eventResponseStatic = z.infer<typeof eventResponse>;
export type listEventResponseStatic = z.infer<typeof listEventResponse>;
export type eventParamsStatic = z.infer<typeof eventParams>;
export type createEventSchemaStatic = z.infer<typeof createEventSchema>;
