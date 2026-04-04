import { v7 } from "uuid";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { calendarRepository } from "./calendar.repository";
import type {
	calendarEventRequestStatic,
	calendarEventUpdateRequestStatic,
} from "./calendar.dto";

export const calendarService = {
	async create(userId: string, event: calendarEventRequestStatic) {
		const newEvent = {
			id: v7(),
			userId,
			title: event.title,
			description: event.description || null,
			dueDate: event.dueDate || null,
			type: event.type,
			status: event.status || "pending",
			courseName: event.courseName || null,
			createdAt: new Date(),
			updatedAt: new Date(),
			syllabusId: null,
		};

		await calendarRepository.create(newEvent);
		return newEvent;
	},

	async findById(eventId: string) {
		const [event] = await calendarRepository.findById(eventId);
		if (!event) throw new NotFoundError("Calendar event not found");
		return event;
	},

	async findAllByUserId(userId: string, startDate?: string, endDate?: string) {
		if (startDate && endDate) {
			return await calendarRepository.findByUserIdAndDateRange(
				userId,
				new Date(startDate),
				new Date(endDate),
			);
		}
		return await calendarRepository.findByUserId(userId);
	},

	async updateById(
		userId: string,
		eventId: string,
		data: calendarEventUpdateRequestStatic,
	) {
		const [event] = await calendarRepository.findById(eventId);

		if (!event || event.userId !== userId) {
			throw new NotFoundError("Calendar event not found");
		}

		const updatedEvent = {
			...data,
			dueDate: data.dueDate !== undefined ? data.dueDate || null : undefined,
			updatedAt: new Date(),
		};

		Object.keys(updatedEvent).forEach((key) => {
			if ((updatedEvent as any)[key] === undefined) {
				delete (updatedEvent as any)[key];
			}
		});

		await calendarRepository.updateById(eventId, updatedEvent);

		return {
			...event,
			...updatedEvent,
		};
	},

	async deleteById(userId: string, eventId: string) {
		const [event] = await calendarRepository.findById(eventId);

		if (!event || event.userId !== userId) {
			throw new NotFoundError("Calendar event not found");
		}

		await calendarRepository.deleteById(eventId);
	},
};
