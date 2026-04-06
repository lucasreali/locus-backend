import { redis } from '@/database/redis';
import { Worker } from 'bullmq';
import { v7 } from 'uuid';
import { eventRepository } from '../event/event.repository';
import { NOTIFICATION_QUEUE_NAME } from './notification.queue';
import { notificationRepository } from './notification.repository';

export const notificationWorker = new Worker(
	NOTIFICATION_QUEUE_NAME,
	async () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = tomorrow.toISOString().split('T')[0];

		const events = await eventRepository.findPendingByDueDate(tomorrowStr);

		for (const event of events) {
			const already = await notificationRepository.existsForEvent(
				event.userId,
				event.id,
			);

			if (already) continue;

			const message = `"${event.title}" is due tomorrow.`;

			await notificationRepository.create({
				id: v7(),
				userId: event.userId,
				eventId: event.id,
				type: 'upcoming_deadline',
				message,
				read: false,
				createdAt: new Date(),
			});

			await redis.publish(
				`notifications:${event.userId}`,
				JSON.stringify({
					type: 'upcoming_deadline',
					message,
					eventId: event.id,
				}),
			);
		}
	},
	{ connection: redis },
);
