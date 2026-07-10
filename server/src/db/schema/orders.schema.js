import { pgTable, uuid, text, numeric, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { products } from './products.schema.js';
import { productVariants } from './variants.schema.js';
import { quotations } from './quotations.schema.js';

export const rentalOrders = pgTable(
    'rental_orders',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orderNo: text('order_no').unique().notNull(),
        quotationId: uuid('quotation_id')
            .references(() => quotations.id, { onDelete: 'set null' }),
        customerId: uuid('customer_id')
            .references(() => users.id, { onDelete: 'restrict' })
            .notNull(),
        vendorId: uuid('vendor_id')
            .references(() => users.id, { onDelete: 'restrict' }),
        status: text('status').default('Confirmed').notNull(), // 'Confirmed', 'PickedUp', 'Active', 'Returned', 'Cancelled', 'Completed'
        pickupDate: timestamp('pickup_date', { withTimezone: true }),
        expectedReturnDate: timestamp('expected_return_date', { withTimezone: true }),
        actualReturnDate: timestamp('actual_return_date', { withTimezone: true }),
        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            orderNoIdx: index('rental_orders_order_no_idx').on(table.orderNo),
            customerIdIdx: index('rental_orders_customer_id_idx').on(table.customerId),
            vendorIdIdx: index('rental_orders_vendor_id_idx').on(table.vendorId),
        };
    }
);

export const rentalOrderItems = pgTable(
    'rental_order_items',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orderId: uuid('order_id')
            .references(() => rentalOrders.id, { onDelete: 'cascade' })
            .notNull(),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'restrict' })
            .notNull(),
        variantId: uuid('variant_id')
            .references(() => productVariants.id, { onDelete: 'restrict' }),
        quantity: integer('quantity').default(1).notNull(),
        pricePerUnit: numeric('price_per_unit', { precision: 10, scale: 2 }).notNull(),
        rentalStart: timestamp('rental_start', { withTimezone: true }).notNull(),
        rentalEnd: timestamp('rental_end', { withTimezone: true }).notNull(),
        subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            orderIdIdx: index('rental_order_items_order_id_idx').on(table.orderId),
        };
    }
);
