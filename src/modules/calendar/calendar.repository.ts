import { db } from "@/database/db";
import { schema } from "@/database/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { createCalendarEventSchemaStatic, calendarEventUpdateRequestStatic } from "./calendar.dto";

export const calendarRepository = {
	async create(data: createCalendarEventSchemaStatic) {
		await db.insert(schema.calendarEvents).values(data);
	},
    
    async createMany(data: createCalendarEventSchemaStatic[]) {
        if (data.length === 0) return;
        await db.insert(schema.calendarEvents).values(data);
    },

	async findById(id: string) {
        return await db
            .select()
            .from(schema.calendarEvents)
            .where(eq(schema.calendarEvents.id, id));
	},

	async findByUserId(userId: string) {
		return await db
            .select()
            .from(schema.calendarEvents)
            .where(eq(schema.calendarEvents.userId, userId))
            .orderBy(desc(schema.calendarEvents.dueDate));
	},
    
    async findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date) {
        return await db
            .select()
            .from(schema.calendarEvents)
            .where(
                and(
                    eq(schema.calendarEvents.userId, userId),
                    gte(schema.calendarEvents.dueDate, startDate.toISOString().split('T')[0]),
                    lte(schema.calendarEvents.dueDate, endDate.toISOString().split('T')[0])
                )
            )
            .orderBy(desc(schema.calendarEvents.dueDate));
    },

	async updateById(id: string, data: calendarEventUpdateRequestStatic & { updatedAt?: Date }) {
		await db
            .update(schema.calendarEvents)
            .set(data)
            .where(eq(schema.calendarEvents.id, id));
	},

	async deleteById(id: string) {
		await db.delete(schema.calendarEvents).where(eq(schema.calendarEvents.id, id));
	},
};
