import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "../auth/users";

export const subjects = pgTable(
	"subjects",
	{
		id: text("id")
			.primaryKey()
			.$default(() => v7()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		icon: text("icon").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("subjects_user_id_idx").on(table.userId)],
);
