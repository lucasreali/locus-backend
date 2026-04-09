import { and, eq } from "drizzle-orm";
import { db } from "@/database/db";
import { schema } from "@/database/schema";
import { cacheService } from "@/shared/services/cache.service";
import type {
	createSubjectSchemaStatic,
	subjectUpdateRequestStatic,
} from "./subject.dto";

const SUBJECT_CACHE_TTL = 300;

export const subjectRepository = {
	async create(data: createSubjectSchemaStatic) {
		await db.insert(schema.subjects).values(data);
		await cacheService.del("subject:list", data.userId);
	},

	async findAllByUserId(userId: string) {
		return await cacheService.getOrSet(
			"subject:list",
			userId,
			async () => {
				return await db
					.select()
					.from(schema.subjects)
					.where(eq(schema.subjects.userId, userId));
			},
			{ ttl: SUBJECT_CACHE_TTL },
		);
	},

	async findByIdAndUserId(subjectId: string, userId: string) {
		return await cacheService.getOrSet(
			"subject",
			subjectId,
			async () => {
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
			{ ttl: SUBJECT_CACHE_TTL },
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

		await cacheService.del("subject", subjectId);
		await cacheService.del("subject:list", userId);
	},

	async findAllWithNotes(userId: string) {
		return await db
			.select()
			.from(schema.subjects)
			.leftJoin(schema.notes, eq(schema.notes.subjectId, schema.subjects.id))
			.where(eq(schema.subjects.userId, userId))
			.orderBy(schema.subjects.name);
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

		await cacheService.del("subject", subjectId);
		await cacheService.del("subject:list", userId);
	},
};
