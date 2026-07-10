import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    index,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
    'users',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        email: text('email').unique().notNull(),
        password: text('password').notNull(),
        role: text('role').default('USER').notNull(),
        emailVerified: boolean('email_verified').default(false).notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        isDeleted: boolean('is_deleted').default(false).notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            emailIdx: index('users_email_idx').on(table.email),
            roleIdx: index('users_role_idx').on(table.role),
            isDeletedIdx: index('users_is_deleted_idx').on(table.isDeleted),
        };
    },
);
