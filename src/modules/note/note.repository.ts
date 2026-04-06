import { db } from "@/database/db";
import { schema } from "@/database/schema";
import { cacheService } from "@/shared/services/cache.service";
import { and, desc, eq, ilike } from "drizzle-orm";
import type {
	createNoteSchemaStatic,
	noteQueryParamsStatic,
	noteUpdateRequestStatic,
} from "./note.dto";

const NOTE_CACHE_TTL = 120;

export const noteRepository = {
	async create(data: createNoteSchemaStatic) {
		await db.insert(schema.notes).values(data);
	},

	async findById(id: string) {
		return await cacheService.getOrSet(
			"note",
			id,
			async () => {
				return await db
					.select()
					.from(schema.notes)
					.where(eq(schema.notes.id, id));
			},
			{ ttl: NOTE_CACHE_TTL },
		);
	},

	async findAllByUserId(userId: string, filters: noteQueryParamsStatic) {
		const conditions = [eq(schema.notes.userId, userId)];

		if (filters.subjectId) {
			conditions.push(eq(schema.notes.subjectId, filters.subjectId));
		}

		if (filters.search) {
			conditions.push(ilike(schema.notes.title, `%${filters.search}%`));
		}

		return await db
			.select()
			.from(schema.notes)
			.where(and(...conditions))
			.orderBy(desc(schema.notes.updatedAt))
			.limit(filters.limit)
			.offset(filters.offset);
	},

	async updateById(
		id: string,
		userId: string,
		data: noteUpdateRequestStatic & { updatedAt?: Date },
	) {
		await db
			.update(schema.notes)
			.set(data)
			.where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)));

		await cacheService.del("note", id);
	},

	async deleteById(id: string, userId: string) {
		await db
			.delete(schema.notes)
			.where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)));

		await cacheService.del("note", id);
	},
};
