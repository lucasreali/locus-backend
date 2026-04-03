import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const users = pgTable(
	"users",
	{
		id: text("id")
			.primaryKey()
			.$default(() => v7()),
		name: text("name").notNull(),
		email: text("email").notNull(),
		avatarUrl: text("avatar_url"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [uniqueIndex("users_email_idx").on(table.email)],
);
