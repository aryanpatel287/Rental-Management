import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';

export const productImages = pgTable(
    'product_images',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'cascade' })
            .notNull(),
        url: text('url').notNull(),
        isPrimary: boolean('is_primary').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            productIdIdx: index('product_images_product_id_idx').on(table.productId),
        };
    }
);
