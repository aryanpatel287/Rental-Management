import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const userProfiles = pgTable('user_profiles', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    phone: text('phone'),
    companyName: text('company_name'),
    gstin: text('gstin'),
    avatar: text('avatar'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
});
