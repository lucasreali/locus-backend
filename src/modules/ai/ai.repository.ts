import { eq } from "drizzle-orm";
import { db } from "@/database/db";
import { schema } from "@/database/schema";
import type { createAiSchemaStatic } from "./ai.dto";

export const aiRepository = {
	async create(data: createAiSchemaStatic) {
		const [file] = await db.insert(schema.aiUploads).values(data).returning();
		return file;
	},

	async updateById(
		id: string,
		data: Partial<typeof schema.aiUploads.$inferInsert>,
	) {
		const [file] = await db
			.update(schema.aiUploads)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.aiUploads.id, id))
			.returning();
		return file;
	},

	async findById(id: string) {
		const [file] = await db
			.select()
			.from(schema.aiUploads)
			.where(eq(schema.aiUploads.id, id));
		return file;
	},

	async findAllByUserId(userId: string) {
		return await db
			.select()
			.from(schema.aiUploads)
			.where(eq(schema.aiUploads.userId, userId));
	},

	async deleteById(id: string) {
		await db.delete(schema.aiUploads).where(eq(schema.aiUploads.id, id));
	},
};
