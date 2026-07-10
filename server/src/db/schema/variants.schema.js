import { pgTable, uuid, text, boolean, timestamp, numeric, integer, index, primaryKey } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';
import { attributeValues } from './attributes.schema.js';

export const productVariants = pgTable(
    'product_variants',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        productId: uuid('product_id')
            .references(() => products.id, { onDelete: 'cascade' })
            .notNull(),
        sku: text('sku').unique().notNull(),
        price: numeric('price', { precision: 10, scale: 2 }),
        stock: integer('stock').default(0).notNull(),
        isPublished: boolean('is_published').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            productIdIdx: index('product_variants_product_id_idx').on(table.productId),
            skuIdx: index('product_variants_sku_idx').on(table.sku),
        };
    }
);

export const variantAttributeValues = pgTable(
    'variant_attribute_values',
    {
        variantId: uuid('variant_id')
            .references(() => productVariants.id, { onDelete: 'cascade' })
            .notNull(),
        attributeValueId: uuid('attribute_value_id')
            .references(() => attributeValues.id, { onDelete: 'cascade' })
            .notNull(),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.variantId, table.attributeValueId] }),
        };
    }
);
