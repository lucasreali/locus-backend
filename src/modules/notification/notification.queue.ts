import { redis as connection } from '@/database/redis';
import { Queue } from 'bullmq';

export const NOTIFICATION_QUEUE_NAME = 'notification-check';

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
	connection,
	defaultJobOptions: {
		removeOnComplete: true,
		removeOnFail: false,
	},
});

export const scheduleNotificationCron = async () => {
	await notificationQueue.add(
		'check-upcoming-events',
		{},
		{
			repeat: { cron: '0 8 * * *' },
			jobId: 'check-upcoming-events-cron',
		},
	);
};
