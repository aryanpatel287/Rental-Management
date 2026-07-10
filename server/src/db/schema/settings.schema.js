import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';

export const settings = pgTable(
    'settings',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        companyName: text('company_name'),
        gstNumber: text('gst_number'),
        supportEmail: text('support_email'),
        lateFeePerDay: numeric('late_fee_per_day', { precision: 10, scale: 2 }).default('0.00').notNull(),
        currency: text('currency').default('INR').notNull(),
        timezone: text('timezone').default('Asia/Kolkata').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    }
);
