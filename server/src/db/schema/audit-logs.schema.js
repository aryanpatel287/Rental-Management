import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const auditLogs = pgTable(
    'audit_logs',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'set null' }),
        action: text('action').notNull(), // e.g. 'create', 'update', 'delete'
        entity: text('entity').notNull(), // e.g. 'inventory', 'invoice'
        entityId: uuid('entity_id').notNull(),
        oldValue: jsonb('old_value'),
        newValue: jsonb('new_value'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
            entityIdx: index('audit_logs_entity_idx').on(table.entity, table.entityId),
        };
    }
);
