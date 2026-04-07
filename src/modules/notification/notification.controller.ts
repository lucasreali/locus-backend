import { redis } from '@/database/redis';
import { RATE_LIMITS } from '@/plugins/rate-limit';
import { noContentResponse } from '@/shared/dtos';
import { authHandler } from '@/shared/middlewares/auth-handler';
import type { FastifyTypeInstance } from '@/types';
import {
	listNotificationResponse,
	notificationParams,
	type listNotificationResponseStatic,
} from './notification.dto';
import { notificationService } from './notification.service';

export const notificationController = (app: FastifyTypeInstance) => {
	app.get(
		'/stream',
		{
			preHandler: authHandler,
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ['notifications'],
				description: 'SSE stream for real-time notifications',
			},
		},
		async (req, rep) => {
			const { id: userId } = req.user;

			rep.raw.setHeader('Content-Type', 'text/event-stream');
			rep.raw.setHeader('Cache-Control', 'no-cache');
			rep.raw.setHeader('Connection', 'keep-alive');
			rep.raw.flushHeaders();

			const subscriber = redis.duplicate();
			await subscriber.subscribe(`notifications:${userId}`);

			subscriber.on('message', (_channel, message) => {
				rep.raw.write(`data: ${message}\n\n`);
			});

			const keepalive = setInterval(() => {
				rep.raw.write(': keepalive\n\n');
			}, 30_000);

			const cleanup = () => {
				clearInterval(keepalive);
				subscriber.unsubscribe().catch(() => {});
				subscriber.disconnect();
			};

			await new Promise<void>((resolve) => {
				req.raw.socket?.once('close', resolve);
			});

			cleanup();
		},
	);

	app.get(
		'',
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ['notifications'],
				description: 'List all notifications',
				response: {
					200: listNotificationResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const notifications = await notificationService.findAllByUserId(id);
			return rep.status(200).send(notifications as listNotificationResponseStatic);
		},
	);

	app.patch(
		'/:notificationId/read',
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				params: notificationParams,
				tags: ['notifications'],
				description: 'Mark notification as read',
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { notificationId } = req.params;
			await notificationService.markAsRead(id, notificationId);
			return rep.status(204).send(null);
		},
	);
};
