import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { v7 } from 'uuid';
import { users } from './auth/users';

export const aiUploads = pgTable('ai_uploads', {
    id: text('id')
        .primaryKey()
        .$default(() => v7()),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    documentType: text('document_type'), // SYLLABUS, ASSIGNMENT, OTHER
    status: text('status').notNull(), // PENDING, PROCESSING, COMPLETED, FAILED
    errorMessage: text('error_message'),
    courseName: text('course_name'),
    professor: text('professor'),
    rawResponse: text('raw_response'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
});
