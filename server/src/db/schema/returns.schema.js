import { pgTable, uuid, integer, numeric, text, timestamp, index } from 'drizzle-orm/pg-core';
import { rentalOrders } from './orders.schema.js';

export const returns = pgTable(
    'returns',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orderId: uuid('order_id')
            .references(() => rentalOrders.id, { onDelete: 'cascade' })
            .notNull(),
        returnedDate: timestamp('returned_date', { withTimezone: true }).defaultNow().notNull(),
        lateDays: integer('late_days').default(0).notNull(),
        lateFee: numeric('late_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
        damageFee: numeric('damage_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            orderIdIdx: index('returns_order_id_idx').on(table.orderId),
        };
    }
);
