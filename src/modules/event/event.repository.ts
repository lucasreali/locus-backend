import { db } from '@/database/db';
import { schema } from '@/database/schema';
import { cacheService } from '@/shared/services/cache.service';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type {
    createEventSchemaStatic,
    eventUpdateRequestStatic,
} from './event.dto';

const EVENT_CACHE_TTL = 120;

const eventTable = schema.events;

export const eventRepository = {
    async create(data: createEventSchemaStatic) {
        await db.insert(eventTable).values(data);
        await cacheService.del('event:list', data.userId);
    },

    async createMany(data: createEventSchemaStatic[]) {
        if (data.length === 0) return;
        await db.insert(eventTable).values(data);
        await cacheService.del('event:list', data[0].userId);
    },

    async findById(id: string) {
        return await cacheService.getOrSet(
            'event',
            id,
            async () => {
                return await db
                    .select()
                    .from(eventTable)
                    .where(eq(eventTable.id, id));
            },
            { ttl: EVENT_CACHE_TTL },
        );
    },

    async findByUserId(userId: string) {
        return await cacheService.getOrSet(
            'event:list',
            userId,
            async () => {
                return await db
                    .select()
                    .from(eventTable)
                    .where(eq(eventTable.userId, userId))
                    .orderBy(desc(eventTable.dueDate));
            },
            { ttl: EVENT_CACHE_TTL },
        );
    },

    async findByUserIdAndDateRange(
        userId: string,
        startDate: Date,
        endDate: Date,
    ) {
        return await db
            .select()
            .from(eventTable)
            .where(
                and(
                    eq(eventTable.userId, userId),
                    gte(
                        eventTable.dueDate,
                        startDate.toISOString().split('T')[0],
                    ),
                    lte(
                        eventTable.dueDate,
                        endDate.toISOString().split('T')[0],
                    ),
                ),
            )
            .orderBy(desc(eventTable.dueDate));
    },

    async updateById(
        id: string,
        data: eventUpdateRequestStatic & { updatedAt?: Date },
        userId: string,
    ) {
        await db.update(eventTable).set(data).where(eq(eventTable.id, id));
        await cacheService.del('event', id);
        await cacheService.del('event:list', userId);
    },

    async deleteById(id: string, userId: string) {
        await db.delete(eventTable).where(eq(eventTable.id, id));
        await cacheService.del('event', id);
        await cacheService.del('event:list', userId);
    },

    async findPendingByDueDate(dueDate: string) {
        return await db
            .select()
            .from(eventTable)
            .where(
                and(
                    eq(eventTable.dueDate, dueDate),
                    eq(eventTable.status, 'pending'),
                ),
            );
    },
};
