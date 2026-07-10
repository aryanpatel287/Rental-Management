import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    integer,
    jsonb,
    index,
} from 'drizzle-orm/pg-core';

export const entityDefinitions = pgTable(
    'entity_definitions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        slug: text('slug').unique().notNull(),
        tableName: text('table_name').unique().notNull(),
        description: text('description'),
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
            slugIdx: index('entity_defs_slug_idx').on(table.slug),
        };
    },
);

export const fieldDefinitions = pgTable(
    'field_definitions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        entityId: uuid('entity_id')
            .references(() => entityDefinitions.id, { onDelete: 'cascade' })
            .notNull(),
        name: text('name').notNull(),
        columnName: text('column_name').notNull(),
        fieldType: text('field_type').notNull(), // text, number, select, date, boolean, email, textarea
        required: boolean('required').default(false).notNull(),
        unique: boolean('unique').default(false).notNull(),
        defaultValue: text('default_value'),
        options: jsonb('options'), // Array of options: [{ label: 'Active', value: 'active' }]
        validation: jsonb('validation'), // validation configuration: { min: 0, max: 100 }
        uiConfig: jsonb('ui_config'), // ui display configuration: { showInList: true, showInForm: true }
        sortOrder: integer('sort_order').default(0).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            entityIdIdx: index('field_defs_entity_id_idx').on(table.entityId),
        };
    },
);
