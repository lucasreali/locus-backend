import { pgTable, text, timestamp, date } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth/users";
import { syllabi } from "./syllabi";

export const calendarEvents = pgTable("calendar_events", {
	id: text("id")
		.primaryKey()
		.$default(() => v7()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	syllabusId: text("syllabus_id").references(() => syllabi.id, {
		onDelete: "set null",
	}),
	title: text("title").notNull(),
	description: text("description"),
	dueDate: date("due_date"),
	type: text("type").notNull(), // exam, assignment, project, presentation, other
	status: text("status").default("pending").notNull(), // pending, completed
	courseName: text("course_name"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});
