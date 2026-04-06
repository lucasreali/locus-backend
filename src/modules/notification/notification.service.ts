import { NotFoundError } from '@/shared/errors/NotFoundError';
import { notificationRepository } from './notification.repository';

export const notificationService = {
	async findAllByUserId(userId: string) {
		return await notificationRepository.findByUserId(userId);
	},

	async markAsRead(userId: string, notificationId: string) {
		const [notification] = await notificationRepository.findById(notificationId);

		if (!notification || notification.userId !== userId) {
			throw new NotFoundError('Notification not found');
		}

		await notificationRepository.markAsRead(notificationId, userId);
	},
};
