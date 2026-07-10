import { db } from '../config/database.js';
import { productImages } from '../db/schema/product-images.schema.js';
import { eq } from 'drizzle-orm';

export async function createProductImage(data) {
    const [image] = await db.insert(productImages).values(data).returning();
    return image;
}

export async function getProductImageById(id) {
    const [image] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.id, id));
    return image || null;
}

export async function getProductImagesByProductId(productId) {
    return await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, productId));
}

export async function updateProductImage(id, updates) {
    const [image] = await db
        .update(productImages)
        .set(updates)
        .where(eq(productImages.id, id))
        .returning();
    return image || null;
}

export async function deleteProductImage(id) {
    const [image] = await db
        .delete(productImages)
        .where(eq(productImages.id, id))
        .returning();
    return image || null;
}
