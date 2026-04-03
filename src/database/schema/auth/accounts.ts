import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./users";

export const accounts = pgTable(
	"accounts",
	{
		id: text("id")
			.primaryKey()
			.$default(() => v7()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" })
			.unique(),
		password: text("password").notNull(),
		accessToken: text("access_token"),
		emailVerified: boolean("email_verified").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("accounts_user_id_idx").on(table.userId)],
);
