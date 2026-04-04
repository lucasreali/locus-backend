import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth/users";
import { subjects } from "./subject/subjects";

export const notes = pgTable(
	"notes",
	{
		id: text("id")
			.primaryKey()
			.$default(() => v7()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		subjectId: text("subject_id").references(() => subjects.id, {
			onDelete: "set null",
		}),
		title: text("title").notNull(),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("notes_user_id_idx").on(table.userId),
		index("notes_user_id_updated_at_idx").on(table.userId, table.updatedAt),
		index("notes_user_id_subject_id_idx").on(table.userId, table.subjectId),
	],
);
