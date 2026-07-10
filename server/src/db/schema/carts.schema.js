import { pgTable, uuid, integer, timestamp, index, text } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { products } from './products.schema.js';
import { productVariants } from './variants.schema.js';

export const carts = pgTable(
    'carts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        customerId: uuid('customer_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            customerIdIdx: index('carts_customer_id_idx').on(table.customerId),
        };
    }
);

export const cartItems = pgTable(
    'cart_items',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        cartId: uuid('cart_id')
            .references(() => carts.id, { onDelete: 'cascade' })
            .notNull(),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'cascade' })
            .notNull(),
        variantId: uuid('variant_id')
            .references(() => productVariants.id, { onDelete: 'cascade' }),
        quantity: integer('quantity').default(1).notNull(),
        rentPeriod: text('rent_period').default('Day').notNull(),
        rentalStart: timestamp('rental_start', { withTimezone: true }).notNull(),
        rentalEnd: timestamp('rental_end', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            cartIdIdx: index('cart_items_cart_id_idx').on(table.cartId),
        };
    }
);
