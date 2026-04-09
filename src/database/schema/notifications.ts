import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { v7 } from 'uuid';
import { users } from './auth/users';
import { events } from './events';

export const notifications = pgTable(
	'notifications',
	{
		id: text('id')
			.primaryKey()
			.$default(() => v7()),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		eventId: text('event_id').references(() => events.id, {
			onDelete: 'set null',
		}),
		type: text('type').notNull(), // upcoming_deadline
		message: text('message').notNull(),
		read: boolean('read').default(false).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [
		index('notifications_user_id_idx').on(table.userId),
		index('notifications_user_id_event_id_idx').on(table.userId, table.eventId),
	],
);
