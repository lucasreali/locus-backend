import { db } from '@/database/db';
import { schema } from '@/database/schema';
import { cacheService } from '@/shared/services/cache.service';
import { and, desc, eq } from 'drizzle-orm';
import type { createNotificationSchemaStatic } from './notification.dto';

const NOTIFICATION_CACHE_TTL = 60;

const notificationTable = schema.notifications;

export const notificationRepository = {
	async create(data: createNotificationSchemaStatic) {
		await db.insert(notificationTable).values(data);
		await cacheService.del('notification:list', data.userId);
	},

	async findByUserId(userId: string) {
		return await cacheService.getOrSet(
			'notification:list',
			userId,
			async () => {
				return await db
					.select()
					.from(notificationTable)
					.where(eq(notificationTable.userId, userId))
					.orderBy(desc(notificationTable.createdAt));
			},
			{ ttl: NOTIFICATION_CACHE_TTL },
		);
	},

	async findById(id: string) {
		return await db
			.select()
			.from(notificationTable)
			.where(eq(notificationTable.id, id));
	},

	async existsForEvent(userId: string, eventId: string) {
		const [row] = await db
			.select()
			.from(notificationTable)
			.where(
				and(
					eq(notificationTable.userId, userId),
					eq(notificationTable.eventId, eventId),
				),
			)
			.limit(1);
		return !!row;
	},

	async markAsRead(notificationId: string, userId: string) {
		await db
			.update(notificationTable)
			.set({ read: true })
			.where(
				and(
					eq(notificationTable.id, notificationId),
					eq(notificationTable.userId, userId),
				),
			);

		await cacheService.del('notification:list', userId);
	},
};
