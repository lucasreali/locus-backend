import { createdAt, id, userId } from '@/shared/dtos';
import { z } from 'zod';

export const notificationResponse = z.object({
	id,
	userId,
	eventId: id.nullable(),
	type: z.string(),
	message: z.string(),
	read: z.boolean(),
	createdAt,
});

export const listNotificationResponse = z.array(notificationResponse);

export const notificationParams = z.object({
	notificationId: id,
});

export const createNotificationSchema = notificationResponse;

export type notificationResponseStatic = z.infer<typeof notificationResponse>;
export type listNotificationResponseStatic = z.infer<typeof listNotificationResponse>;
export type notificationParamsStatic = z.infer<typeof notificationParams>;
export type createNotificationSchemaStatic = z.infer<typeof createNotificationSchema>;
