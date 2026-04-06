import { NotFoundError } from '@/shared/errors/NotFoundError';
import { stripUndefined } from '@/shared/utils/strip-undefined';
import { v7 } from 'uuid';
import type { eventRequestStatic, eventUpdateRequestStatic } from './event.dto';
import type { SyllabusEventType } from '../syllabus/syllabus.prompt';
import { eventRepository } from './event.repository';

export const eventService = {
    async create(userId: string, event: eventRequestStatic) {
        const newEvent = {
            id: v7(),
            userId,
            title: event.title,
            description: event.description || null,
            dueDate: event.dueDate || null,
            type: event.type,
            status: event.status || 'pending',
            courseName: event.courseName || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            syllabusId: null,
        };

        await eventRepository.create(newEvent);
        return newEvent;
    },

    async findById(eventId: string) {
        const [event] = await eventRepository.findById(eventId);
        if (!event) throw new NotFoundError('Event not found');
        return event;
    },

    async findAllByUserId(
        userId: string,
        startDate?: string,
        endDate?: string,
    ) {
        if (startDate && endDate) {
            return await eventRepository.findByUserIdAndDateRange(
                userId,
                new Date(startDate),
                new Date(endDate),
            );
        }
        return await eventRepository.findByUserId(userId);
    },

    async updateById(
        userId: string,
        eventId: string,
        data: eventUpdateRequestStatic,
    ) {
        const [event] = await eventRepository.findById(eventId);

        if (!event || event.userId !== userId) {
            throw new NotFoundError('Event not found');
        }

        const updatedEvent = stripUndefined({
            ...data,
            dueDate:
                data.dueDate !== undefined ? data.dueDate || null : undefined,
            updatedAt: new Date(),
        });

        await eventRepository.updateById(eventId, updatedEvent);

        return {
            ...event,
            ...updatedEvent,
        };
    },

    async deleteById(userId: string, eventId: string) {
        const [event] = await eventRepository.findById(eventId);

        if (!event || event.userId !== userId) {
            throw new NotFoundError('Event not found');
        }

        await eventRepository.deleteById(eventId);
    },

    async createManyFromSyllabus(
        userId: string,
        syllabusId: string,
        events: Array<{
            title: string;
            description: string | null;
            dueDate: string | null;
            type: SyllabusEventType;
            courseName: string | null;
        }>,
    ) {
        const records = events.map((event) => ({
            id: v7(),
            userId,
            syllabusId,
            title: event.title,
            description: event.description,
            dueDate: event.dueDate,
            type: event.type,
            status: 'pending' as const,
            courseName: event.courseName,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        await eventRepository.createMany(records);
        return records;
    },
};
