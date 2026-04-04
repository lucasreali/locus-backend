import { db } from '@/database/db';
import { schema } from '@/database/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type {
    createEventSchemaStatic,
    eventUpdateRequestStatic,
} from './event.dto';

const eventTable = schema.events;

export const eventRepository = {
    async create(data: createEventSchemaStatic) {
        await db.insert(eventTable).values(data);
    },

    async createMany(data: createEventSchemaStatic[]) {
        if (data.length === 0) return;
        await db.insert(eventTable).values(data);
    },

    async findById(id: string) {
        return await db.select().from(eventTable).where(eq(eventTable.id, id));
    },

    async findByUserId(userId: string) {
        return await db
            .select()
            .from(eventTable)
            .where(eq(eventTable.userId, userId))
            .orderBy(desc(eventTable.dueDate));
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
    ) {
        await db.update(eventTable).set(data).where(eq(eventTable.id, id));
    },

    async deleteById(id: string) {
        await db.delete(eventTable).where(eq(eventTable.id, id));
    },
};
