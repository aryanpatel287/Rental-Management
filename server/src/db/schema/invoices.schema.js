import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { rentalOrders } from './orders.schema.js';

export const invoices = pgTable(
    'invoices',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        invoiceNo: text('invoice_no').unique().notNull(),
        orderId: uuid('order_id')
            .references(() => rentalOrders.id, { onDelete: 'restrict' })
            .notNull(),
        customerId: uuid('customer_id')
            .references(() => users.id, { onDelete: 'restrict' })
            .notNull(),
        status: text('status').default('Draft').notNull(), // 'Draft', 'Pending', 'Paid', 'Cancelled'
        subtotal: numeric('subtotal', { precision: 10, scale: 2 }).default('0.00').notNull(),
        gst: numeric('gst', { precision: 10, scale: 2 }).default('0.00').notNull(),
        discount: numeric('discount', { precision: 10, scale: 2 }).default('0.00').notNull(),
        securityDeposit: numeric('security_deposit', { precision: 10, scale: 2 }).default('0.00').notNull(),
        lateFee: numeric('late_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
        grandTotal: numeric('grand_total', { precision: 10, scale: 2 }).default('0.00').notNull(),
        issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            invoiceNoIdx: index('invoices_invoice_no_idx').on(table.invoiceNo),
            orderIdIdx: index('invoices_order_id_idx').on(table.orderId),
            customerIdIdx: index('invoices_customer_id_idx').on(table.customerId),
        };
    }
);
