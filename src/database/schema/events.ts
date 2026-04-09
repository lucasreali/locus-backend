import { date, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { v7 } from 'uuid';
import { users } from './auth/users';
import { syllabusUploads } from './syllabus-uploads';

export const events = pgTable(
    'events',
    {
        id: text('id')
            .primaryKey()
            .$default(() => v7()),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        syllabusId: text('syllabus_id').references(() => syllabusUploads.id, {
            onDelete: 'set null',
        }),
        title: text('title').notNull(),
        description: text('description'),
        dueDate: date('due_date'),
        type: text('type').notNull(), // exam, assignment, project, presentation, other
        status: text('status').default('pending').notNull(), // pending, completed
        courseName: text('course_name'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index('events_user_id_idx').on(table.userId),
        index('events_user_id_due_date_idx').on(table.userId, table.dueDate),
        index('events_due_date_status_idx').on(table.dueDate, table.status),
    ],
);
