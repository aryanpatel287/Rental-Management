import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { rentalOrders } from './orders.schema.js';

export const pickups = pgTable(
    'pickups',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orderId: uuid('order_id')
            .references(() => rentalOrders.id, { onDelete: 'cascade' })
            .notNull(),
        vendorId: uuid('vendor_id')
            .references(() => users.id, { onDelete: 'restrict' })
            .notNull(),
        status: text('status').notNull(),
        pickupTime: timestamp('pickup_time', { withTimezone: true }),
        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            orderIdIdx: index('pickups_order_id_idx').on(table.orderId),
        };
    }
);
