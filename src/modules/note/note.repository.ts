import { db } from "@/database/db";
import { schema } from "@/database/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import type {
	createNoteSchemaStatic,
	noteQueryParamsStatic,
	noteUpdateRequestStatic,
} from "./note.dto";

const noteTable = schema.notes;

export const noteRepository = {
	async create(data: createNoteSchemaStatic) {
		await db.insert(noteTable).values(data);
	},

	async findById(id: string) {
		return await db.select().from(noteTable).where(eq(noteTable.id, id));
	},

	async findAllByUserId(userId: string, filters: noteQueryParamsStatic) {
		const conditions = [eq(noteTable.userId, userId)];

		if (filters.subjectId) {
			conditions.push(eq(noteTable.subjectId, filters.subjectId));
		}

		if (filters.search) {
			conditions.push(ilike(noteTable.title, `%${filters.search}%`));
		}

		return await db
			.select()
			.from(noteTable)
			.where(and(...conditions))
			.orderBy(desc(noteTable.updatedAt))
			.limit(filters.limit)
			.offset(filters.offset);
	},

	async updateById(
		id: string,
		userId: string,
		data: noteUpdateRequestStatic & { updatedAt?: Date },
	) {
		await db
			.update(noteTable)
			.set(data)
			.where(and(eq(noteTable.id, id), eq(noteTable.userId, userId)));
	},

	async deleteById(id: string, userId: string) {
		await db
			.delete(noteTable)
			.where(and(eq(noteTable.id, id), eq(noteTable.userId, userId)));
	},
};
