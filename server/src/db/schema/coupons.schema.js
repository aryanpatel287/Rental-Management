import { pgTable, uuid, text, numeric, integer, boolean, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const coupons = pgTable(
    'coupons',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        code: text('code').unique().notNull(),
        discountType: text('discount_type').notNull(), // 'percentage' or 'flat'
        discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
        minimumOrder: numeric('minimum_order', { precision: 10, scale: 2 }).default('0.00').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        usageLimit: integer('usage_limit'),
        usedCount: integer('used_count').default(0).notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            codeIdx: index('coupons_code_idx').on(table.code),
        };
    }
);

export const couponUsages = pgTable(
    'coupon_usages',
    {
        couponId: uuid('coupon_id')
            .references(() => coupons.id, { onDelete: 'cascade' })
            .notNull(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.couponId, table.userId] }),
        };
    }
);
