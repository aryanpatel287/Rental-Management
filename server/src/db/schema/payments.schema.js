import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { invoices } from './invoices.schema.js';

export const payments = pgTable(
    'payments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        invoiceId: uuid('invoice_id')
            .references(() => invoices.id, { onDelete: 'restrict' })
            .notNull(),
        gateway: text('gateway').notNull(),
        transactionId: text('transaction_id').notNull(),
        amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
        paymentType: text('payment_type').notNull(), // 'Deposit', 'Partial', 'Full', 'Refund'
        status: text('status').notNull(),
        paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            invoiceIdIdx: index('payments_invoice_id_idx').on(table.invoiceId),
        };
    }
);
