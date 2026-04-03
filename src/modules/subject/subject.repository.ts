import { db } from "@/database/db";
import { schema } from "@/database/schema";
import { and, eq } from "drizzle-orm";
import type {
	createSubjectSchemaStatic,
	subjectUpdateRequestStatic,
} from "./subject.dto";

export const subjectRepository = {
	async create(data: createSubjectSchemaStatic) {
		await db.insert(schema.subjects).values(data);
	},

	async findAllByUserId(userId: string) {
		return await db
			.select()
			.from(schema.subjects)
			.where(eq(schema.subjects.userId, userId));
	},

	async findByIdAndUserId(subjectId: string, userId: string) {
		return await db
			.select()
			.from(schema.subjects)
			.where(
				and(
					eq(schema.subjects.id, subjectId),
					eq(schema.subjects.userId, userId),
				),
			);
	},

	async updateByIdAndUserId(
		subjectId: string,
		userId: string,
		data: subjectUpdateRequestStatic & { updatedAt?: Date },
	) {
		await db
			.update(schema.subjects)
			.set(data)
			.where(
				and(
					eq(schema.subjects.id, subjectId),
					eq(schema.subjects.userId, userId),
				),
			);
	},

	async deleteByIdAndUserId(subjectId: string, userId: string) {
		await db
			.delete(schema.subjects)
			.where(
				and(
					eq(schema.subjects.id, subjectId),
					eq(schema.subjects.userId, userId),
				),
			);
	},
};
