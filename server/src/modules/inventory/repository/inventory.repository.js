import { db } from '../../../config/database.js';
import { inventory, products, productVariants, rentalRates } from '../../../db/schema/schema.js';
import { eq, and, sql, or, like } from 'drizzle-orm';

export async function findInventory({ page, limit, search, vendorId, categoryId, status }) {
    const offset = (page - 1) * limit;
    let query = db.select({
        productId: inventory.productId,
        variantId: inventory.variantId,
        availableQty: inventory.availableQty,
        reservedQty: inventory.reservedQty,
        withCustomerQty: inventory.withCustomerQty,
        damagedQty: inventory.damagedQty,
        maintenanceQty: inventory.maintenanceQty,
        productName: products.name,
        productVendorId: products.vendorId,
        productCategoryId: products.categoryId,
        variantSku: productVariants.sku
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .leftJoin(productVariants, eq(inventory.variantId, productVariants.id));

    const conditions = [];
    if (search) {
        conditions.push(or(
            like(products.name, `%${search}%`),
            like(productVariants.sku, `%${search}%`)
        ));
    }
    if (vendorId) {
        conditions.push(eq(products.vendorId, vendorId));
    }
    if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
    }
    if (status === 'low-stock') {
        conditions.push(sql`${inventory.availableQty} < 5`);
    }

    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);
    return results;
}

export async function findByProductId(productId) {
    const records = await db.select()
        .from(inventory)
        .where(eq(inventory.productId, productId));
    
    const rates = await db.select()
        .from(rentalRates)
        .where(eq(rentalRates.productId, productId));

    return { inventory: records, rates };
}

export async function updateInventoryRow(productId, variantId, updates, tx = db) {
    let cond = eq(inventory.productId, productId);
    if (variantId) {
        cond = and(cond, eq(inventory.variantId, variantId));
    } else {
        cond = and(cond, sql`${inventory.variantId} IS NULL`);
    }
    return tx.update(inventory)
        .set({ ...updates, updatedAt: new Date() })
        .where(cond)
        .returning();
}

export async function getInventoryRow(productId, variantId, tx = db) {
    let cond = eq(inventory.productId, productId);
    if (variantId) {
        cond = and(cond, eq(inventory.variantId, variantId));
    } else {
        cond = and(cond, sql`${inventory.variantId} IS NULL`);
    }
    const records = await tx.select().from(inventory).where(cond);
    return records[0] || null;
}
