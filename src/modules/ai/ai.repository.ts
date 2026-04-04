import { db } from "@/database/db";
import { schema } from "@/database/schema";
import { eq } from "drizzle-orm";
import type { createSyllabusSchemaStatic } from "./ai.dto";

export const syllabusRepository = {
	async create(data: createSyllabusSchemaStatic) {
		const [file] = await db.insert(schema.syllabi).values(data).returning();
		return file;
	},

	async updateById(
		id: string,
		data: Partial<typeof schema.syllabi.$inferInsert>,
	) {
		const [file] = await db
			.update(schema.syllabi)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.syllabi.id, id))
			.returning();
		return file;
	},

	async findById(id: string) {
		const [file] = await db
			.select()
			.from(schema.syllabi)
			.where(eq(schema.syllabi.id, id));
		return file;
	},

	async findAllByUserId(userId: string) {
		return await db
			.select()
			.from(schema.syllabi)
			.where(eq(schema.syllabi.userId, userId));
	},

	async deleteById(id: string) {
		await db.delete(schema.syllabi).where(eq(schema.syllabi.id, id));
	},
};
