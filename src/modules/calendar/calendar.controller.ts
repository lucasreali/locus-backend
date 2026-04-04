import { RATE_LIMITS } from "@/plugins/rate-limit";
import { noContentResponse } from "@/shared/dtos";
import { authHandler } from "@/shared/middlewares/auth-handler";
import type { FastifyTypeInstance } from "@/types";
import { z } from "zod";
import { ForbiddenError } from "@/shared/errors/ForbiddenError";
import {
	calendarEventParams,
	calendarEventRequest,
	calendarEventResponse,
	calendarEventUpdateRequest,
	listCalendarEventResponse,
} from "./calendar.dto";
import { calendarService } from "./calendar.service";

const queryParams = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export const calendarController = (app: FastifyTypeInstance) => {
	app.post(
		"",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				tags: ["calendar"],
				description: "Create calendar event",
				body: calendarEventRequest,
				response: {
					201: calendarEventResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const event = req.body;
			const newEvent = await calendarService.create(id, event);
			return rep.status(201).send(newEvent);
		},
	);

	app.get(
		"/:eventId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: calendarEventParams,
				tags: ["calendar"],
				description: "Get calendar event by ID",
				response: {
					200: calendarEventResponse,
				},
			},
		},
		async (req, rep) => {
			const { eventId } = req.params;
			const { id: userId } = req.user;
			const event = await calendarService.findById(eventId);
			if (event.userId !== userId) {
				throw new ForbiddenError("Forbidden");
			}
			return rep.status(200).send(event as any);
		},
	);

	app.get(
		"",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				tags: ["calendar"],
				description: "List all calendar events",
				querystring: queryParams,
				response: {
					200: listCalendarEventResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { startDate, endDate } = req.query;
			const events = await calendarService.findAllByUserId(
				id,
				startDate,
				endDate,
			);
			return rep.status(200).send(events as any);
		},
	);

	app.put(
		"/:eventId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: calendarEventParams,
				body: calendarEventUpdateRequest,
				tags: ["calendar"],
				description: "Update calendar event",
				response: {
					200: calendarEventResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { eventId } = req.params;
			const updateData = req.body;
			const updatedEvent = await calendarService.updateById(
				id,
				eventId,
				updateData,
			);
			return rep.status(200).send(updatedEvent as any);
		},
	);

	app.delete(
		"/:eventId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: calendarEventParams,
				tags: ["calendar"],
				description: "Delete calendar event",
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { eventId } = req.params;
			await calendarService.deleteById(id, eventId);
			return rep.status(204).send(null);
		},
	);
};
