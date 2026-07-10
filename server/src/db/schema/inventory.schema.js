import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';
import { productVariants } from './variants.schema.js';

export const inventory = pgTable(
    'inventory',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'cascade' })
            .notNull(),
        variantId: uuid('variant_id')
            .references(() => productVariants.id, { onDelete: 'cascade' }),
        availableQty: integer('available_qty').default(0).notNull(),
        reservedQty: integer('reserved_qty').default(0).notNull(),
        withCustomerQty: integer('with_customer_qty').default(0).notNull(),
        maintenanceQty: integer('maintenance_qty').default(0).notNull(),
        damagedQty: integer('damaged_qty').default(0).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            productIdIdx: index('inventory_product_id_idx').on(table.productId),
            variantIdIdx: index('inventory_variant_id_idx').on(table.variantId),
        };
    }
);
