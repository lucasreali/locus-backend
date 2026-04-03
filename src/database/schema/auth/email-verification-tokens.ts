import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./users";

export const emailVerificationTokens = pgTable("email_verification_tokens", {
	id: text("id")
		.primaryKey()
		.$default(() => v7()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
