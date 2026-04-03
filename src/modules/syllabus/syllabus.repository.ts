import { db } from "@/database/db";
import { syllabi } from "@/database/schema/syllabi";
import { eq } from "drizzle-orm";
import { BasicError as InternalServerError } from "@/shared/errors/BasicError";

export class SyllabusRepository {
	async create(data: typeof syllabi.$inferInsert) {
		try {
			const [file] = await db.insert(syllabi).values(data).returning();
			return file;
		} catch (error) {
			throw new InternalServerError("Error creating syllabus record");
		}
	}

	async updateById(id: string, data: Partial<typeof syllabi.$inferInsert>) {
		try {
			const [file] = await db
				.update(syllabi)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(syllabi.id, id))
				.returning();
			return file;
		} catch (error) {
			throw new InternalServerError(`Error updating syllabus with id ${id}`);
		}
	}

	async findById(id: string) {
		try {
			const [file] = await db.select().from(syllabi).where(eq(syllabi.id, id));
			return file;
		} catch (error) {
			throw new InternalServerError(`Error finding syllabus by id ${id}`);
		}
	}

	async findAllByUserId(userId: string) {
		try {
			return await db.select().from(syllabi).where(eq(syllabi.userId, userId));
		} catch (error) {
			throw new InternalServerError(`Error finding syllabi by user id ${userId}`);
		}
	}

    async deleteById(id: string) {
		try {
			return await db.delete(syllabi).where(eq(syllabi.id, id));
		} catch (error) {
			throw new InternalServerError(`Error deleting syllabus with id ${id}`);
		}
	}
}

export const syllabusRepository = new SyllabusRepository();
