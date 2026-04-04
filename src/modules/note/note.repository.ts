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
			.orderBy(desc(noteTable.updatedAt));
	},

	async updateById(
		id: string,
		data: noteUpdateRequestStatic & { updatedAt?: Date },
	) {
		await db.update(noteTable).set(data).where(eq(noteTable.id, id));
	},

	async deleteById(id: string) {
		await db.delete(noteTable).where(eq(noteTable.id, id));
	},
};
