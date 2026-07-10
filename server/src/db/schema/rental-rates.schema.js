import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';
import { productVariants } from './variants.schema.js';

export const rentalRates = pgTable(
    'rental_rates',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'cascade' })
            .notNull(),
        variantId: uuid('variant_id')
            .references(() => productVariants.id, { onDelete: 'cascade' }),
        period: text('period').notNull(), // 'Hour', 'Day', 'Week', 'Custom'
        price: numeric('price', { precision: 10, scale: 2 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            productIdIdx: index('rental_rates_product_id_idx').on(table.productId),
            variantIdIdx: index('rental_rates_variant_id_idx').on(table.variantId),
        };
    }
);
