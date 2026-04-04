import { RATE_LIMITS } from '@/plugins/rate-limit';
import { noContentResponse } from '@/shared/dtos';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { authHandler } from '@/shared/middlewares/auth-handler';
import type { FastifyTypeInstance } from '@/types';
import { z } from 'zod';
import {
    eventParams,
    eventRequest,
    eventResponse,
    type eventResponseStatic,
    eventUpdateRequest,
    listEventResponse,
    type listEventResponseStatic,
} from './event.dto';
import { eventService } from './event.service';

const queryParams = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const eventController = (app: FastifyTypeInstance) => {
    app.post(
        '',
        {
            preHandler: authHandler,
            config: {
                rateLimit: RATE_LIMITS.WRITE,
            },
            schema: {
                security: [{ CookieAuth: [] }],
                tags: ['events'],
                description: 'Create event',
                body: eventRequest,
                response: {
                    201: eventResponse,
                },
            },
        },
        async (req, rep) => {
            const { id } = req.user;
            const event = req.body;
            const newEvent = await eventService.create(id, event);
            return rep.status(201).send(newEvent);
        },
    );

    app.get(
        '/:eventId',
        {
            preHandler: authHandler,
            config: {
                rateLimit: RATE_LIMITS.READ,
            },
            schema: {
                security: [{ CookieAuth: [] }],
                params: eventParams,
                tags: ['events'],
                description: 'Get event by ID',
                response: {
                    200: eventResponse,
                },
            },
        },
        async (req, rep) => {
            const { eventId } = req.params;
            const { id: userId } = req.user;
            const event = await eventService.findById(eventId);
            if (event.userId !== userId) {
                throw new ForbiddenError('Forbidden');
            }
            return rep.status(200).send(event as eventResponseStatic);
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
                security: [{ CookieAuth: [] }],
                tags: ['events'],
                description: 'List all events',
                querystring: queryParams,
                response: {
                    200: listEventResponse,
                },
            },
        },
        async (req, rep) => {
            const { id } = req.user;
            const { startDate, endDate } = req.query;
            const events = await eventService.findAllByUserId(
                id,
                startDate,
                endDate,
            );
            return rep.status(200).send(events as listEventResponseStatic);
        },
    );

    app.put(
        '/:eventId',
        {
            preHandler: authHandler,
            config: {
                rateLimit: RATE_LIMITS.WRITE,
            },
            schema: {
                security: [{ CookieAuth: [] }],
                params: eventParams,
                body: eventUpdateRequest,
                tags: ['events'],
                description: 'Update event',
                response: {
                    200: eventResponse,
                },
            },
        },
        async (req, rep) => {
            const { id } = req.user;
            const { eventId } = req.params;
            const updateData = req.body;
            const updatedEvent = await eventService.updateById(
                id,
                eventId,
                updateData,
            );
            return rep.status(200).send(updatedEvent as eventResponseStatic);
        },
    );

    app.delete(
        '/:eventId',
        {
            preHandler: authHandler,
            config: {
                rateLimit: RATE_LIMITS.WRITE,
            },
            schema: {
                security: [{ CookieAuth: [] }],
                params: eventParams,
                tags: ['events'],
                description: 'Delete event',
                response: {
                    204: noContentResponse,
                },
            },
        },
        async (req, rep) => {
            const { id } = req.user;
            const { eventId } = req.params;
            await eventService.deleteById(id, eventId);
            return rep.status(204).send(null);
        },
    );
};
