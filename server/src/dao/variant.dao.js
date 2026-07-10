import { db } from '../config/database.js';
import { productVariants } from '../db/schema/variants.schema.js';
import { eq } from 'drizzle-orm';

export async function createVariant(data) {
    const [variant] = await db.insert(productVariants).values(data).returning();
    return variant;
}

export async function getVariantById(id) {
    const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, id));
    return variant || null;
}

export async function getVariantBySku(sku) {
    const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.sku, sku));
    return variant || null;
}

export async function getVariantsByProductId(productId) {
    return await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, productId));
}

export async function updateVariant(id, updates) {
    const [variant] = await db
        .update(productVariants)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(productVariants.id, id))
        .returning();
    return variant || null;
}

export async function deleteVariant(id) {
    const [variant] = await db
        .delete(productVariants)
        .where(eq(productVariants.id, id))
        .returning();
    return variant || null;
}
