import { pgTable, uuid, text, numeric, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { products } from './products.schema.js';
import { productVariants } from './variants.schema.js';

export const quotations = pgTable(
    'quotations',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        quotationNo: text('quotation_no').unique().notNull(),
        customerId: uuid('customer_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        status: text('status').default('Draft').notNull(), // 'Draft', 'Sent', 'Confirmed', 'Cancelled'
        subtotal: numeric('subtotal', { precision: 10, scale: 2 }).default('0.00').notNull(),
        gst: numeric('gst', { precision: 10, scale: 2 }).default('0.00').notNull(),
        discount: numeric('discount', { precision: 10, scale: 2 }).default('0.00').notNull(),
        securityDeposit: numeric('security_deposit', { precision: 10, scale: 2 }).default('0.00').notNull(),
        total: numeric('total', { precision: 10, scale: 2 }).default('0.00').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            customerIdIdx: index('quotations_customer_id_idx').on(table.customerId),
            quotationNoIdx: index('quotations_quotation_no_idx').on(table.quotationNo),
        };
    }
);

export const quotationItems = pgTable(
    'quotation_items',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        quotationId: uuid('quotation_id')
            .references(() => quotations.id, { onDelete: 'cascade' })
            .notNull(),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'restrict' })
            .notNull(),
        variantId: uuid('variant_id')
            .references(() => productVariants.id, { onDelete: 'restrict' }),
        quantity: integer('quantity').default(1).notNull(),
        rentalStart: timestamp('rental_start', { withTimezone: true }).notNull(),
        rentalEnd: timestamp('rental_end', { withTimezone: true }).notNull(),
        pricePerUnit: numeric('price_per_unit', { precision: 10, scale: 2 }).notNull(),
        subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            quotationIdIdx: index('quotation_items_quotation_id_idx').on(table.quotationId),
        };
    }
);
