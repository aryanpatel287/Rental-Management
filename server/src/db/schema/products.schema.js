import { pgTable, uuid, text, boolean, timestamp, numeric, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { categories } from './categories.schema.js';

export const products = pgTable(
    'products',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        vendorId: uuid('vendor_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        categoryId: uuid('category_id')
            .references(() => categories.id, { onDelete: 'restrict' })
            .notNull(),
        name: text('name').notNull(),
        slug: text('slug').unique().notNull(),
        description: text('description'),
        isRentable: boolean('is_rentable').default(true).notNull(),
        published: boolean('published').default(false).notNull(),
        costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
        salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
        stock: integer('stock').default(0).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            vendorIdIdx: index('products_vendor_id_idx').on(table.vendorId),
            categoryIdIdx: index('products_category_id_idx').on(table.categoryId),
            slugIdx: index('products_slug_idx').on(table.slug),
        };
    }
);
