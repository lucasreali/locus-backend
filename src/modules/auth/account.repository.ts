import { eq } from "drizzle-orm";
import { db } from "@/database/db";
import { schema } from "@/database/schema";

export const accountRepository = {
	async create(data: { userId: string; password: string }) {
		await db.insert(schema.accounts).values(data);
	},

	async findByInfoLoginByUserEmail(email: string) {
		return await db
			.select()
			.from(schema.accounts)
			.innerJoin(schema.users, eq(schema.accounts.userId, schema.users.id))
			.where(eq(schema.users.email, email));
	},

	async setAccesToken(token: string, userId: string) {
		await db
			.update(schema.accounts)
			.set({
				accessToken: token,
			})
			.where(eq(schema.accounts.userId, userId));
	},

	async findByUserId(userId: string) {
		return await db
			.select()
			.from(schema.accounts)
			.where(eq(schema.accounts.userId, userId));
	},

	async markEmailAsVerified(userId: string) {
		await db
			.update(schema.accounts)
			.set({
				emailVerified: true,
				updatedAt: new Date(),
			})
			.where(eq(schema.accounts.userId, userId));
	},
};
