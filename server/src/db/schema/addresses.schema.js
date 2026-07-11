import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const addresses = pgTable(
    'addresses',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: text('type').notNull(), // 'billing' or 'shipping'
        address1: text('address_1').notNull(),
        address2: text('address_2'),
        city: text('city').notNull(),
        state: text('state').notNull(),
        country: text('country').notNull(),
        zipCode: text('zip_code').notNull(),
        isDefault: boolean('is_default').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            userIdIdx: index('addresses_user_id_idx').on(table.userId),
        };
    }
);
