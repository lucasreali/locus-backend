import { z } from "zod";
import { createdAt, id, updatedAt, userId } from "@/shared/dtos";

export const calendarEventRequest = z.object({
	title: z.string().min(1),
	description: z.string().nullable().optional(),
	dueDate: z.string().nullable().optional(),
	type: z.enum(["exam", "assignment", "project", "presentation", "other"]),
	courseName: z.string().nullable().optional(),
	status: z.enum(["pending", "completed"]).default("pending").optional(),
});

export const calendarEventUpdateRequest = calendarEventRequest.partial();

export const calendarEventResponse = calendarEventRequest.extend({
	id,
	userId,
	syllabusId: id.nullable().optional(),
	createdAt,
	updatedAt,
});

export const listCalendarEventResponse = z.array(calendarEventResponse);

export const calendarEventParams = z.object({
	eventId: id,
});

export const createCalendarEventSchema = calendarEventResponse;

export type calendarEventRequestStatic = z.infer<typeof calendarEventRequest>;
export type calendarEventUpdateRequestStatic = z.infer<
	typeof calendarEventUpdateRequest
>;
export type calendarEventResponseStatic = z.infer<typeof calendarEventResponse>;
export type listCalendarEventResponseStatic = z.infer<
	typeof listCalendarEventResponse
>;
export type calendarEventParamsStatic = z.infer<typeof calendarEventParams>;
export type createCalendarEventSchemaStatic = z.infer<
	typeof createCalendarEventSchema
>;
