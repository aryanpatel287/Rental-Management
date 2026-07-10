import { pgTable, uuid, integer, timestamp, index, text } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';
import { productVariants } from './variants.schema.js';
import { rentalOrderItems } from './orders.schema.js';

export const reservations = pgTable(
    'reservations',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orderItemId: uuid('order_item_id')
            .references(() => rentalOrderItems.id, { onDelete: 'cascade' }),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'cascade' })
            .notNull(),
        variantId: uuid('variant_id')
            .references(() => productVariants.id, { onDelete: 'cascade' }),
        quantity: integer('quantity').default(1).notNull(),
        reservedFrom: timestamp('reserved_from', { withTimezone: true }).notNull(),
        reservedTo: timestamp('reserved_to', { withTimezone: true }).notNull(),
        status: text('status').default('Reserved').notNull(), // 'Reserved', 'Released', 'Completed'
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            orderItemIdx: index('reservations_order_item_idx').on(table.orderItemId),
            productIdx: index('reservations_product_idx').on(table.productId),
            variantIdx: index('reservations_variant_idx').on(table.variantId),
        };
    }
);
