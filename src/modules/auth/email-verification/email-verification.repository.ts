import { and, eq, gt } from "drizzle-orm";
import { db } from "@/database/db";
import { schema } from "@/database/schema";

export const emailVerificationRepository = {
	async create(data: { userId: string; token: string; expiresAt: Date }) {
		await db.insert(schema.emailVerificationTokens).values(data);
	},

	async findByToken(token: string) {
		return await db
			.select()
			.from(schema.emailVerificationTokens)
			.where(
				and(
					eq(schema.emailVerificationTokens.token, token),
					gt(schema.emailVerificationTokens.expiresAt, new Date()),
				),
			);
	},

	async deleteByUserId(userId: string) {
		await db
			.delete(schema.emailVerificationTokens)
			.where(eq(schema.emailVerificationTokens.userId, userId));
	},

	async deleteByToken(token: string) {
		await db
			.delete(schema.emailVerificationTokens)
			.where(eq(schema.emailVerificationTokens.token, token));
	},
};
