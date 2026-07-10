import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const attributes = pgTable(
    'attributes',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    }
);

export const attributeValues = pgTable(
    'attribute_values',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        attributeId: uuid('attribute_id')
            .references(() => attributes.id, { onDelete: 'cascade' })
            .notNull(),
        value: text('value').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            attributeIdIdx: index('attribute_values_attribute_id_idx').on(table.attributeId),
        };
    }
);
