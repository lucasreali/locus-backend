import { eq } from 'drizzle-orm';
import { db } from '@/database/db';
import { schema } from '@/database/schema';
import type { createSyllabusSchemaStatic } from './syllabus.dto';

export const syllabusRepository = {
	async create(data: createSyllabusSchemaStatic) {
		const [record] = await db
			.insert(schema.syllabusUploads)
			.values(data)
			.returning();
		return record;
	},

	async updateById(
		id: string,
		data: Partial<typeof schema.syllabusUploads.$inferInsert>,
	) {
		const [record] = await db
			.update(schema.syllabusUploads)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.syllabusUploads.id, id))
			.returning();
		return record;
	},

	async findById(id: string) {
		const [record] = await db
			.select()
			.from(schema.syllabusUploads)
			.where(eq(schema.syllabusUploads.id, id));
		return record;
	},

	async findAllByUserId(userId: string) {
		return await db
			.select()
			.from(schema.syllabusUploads)
			.where(eq(schema.syllabusUploads.userId, userId));
	},

	async deleteById(id: string) {
		await db
			.delete(schema.syllabusUploads)
			.where(eq(schema.syllabusUploads.id, id));
	},
};
