import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const categories = pgTable(
    'categories',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        slug: text('slug').unique().notNull(),
        description: text('description'),
        parentCategoryId: uuid('parent_category_id').references(() => categories.id, { onDelete: 'set null' }),
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            parentCategoryIdx: index('categories_parent_category_idx').on(table.parentCategoryId),
            slugIdx: index('categories_slug_idx').on(table.slug),
        };
    }
);
