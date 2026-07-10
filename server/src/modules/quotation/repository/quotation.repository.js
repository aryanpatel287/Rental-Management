import { db } from '../../../config/database.js';
import { quotations, quotationItems, products, productVariants } from '../../../db/schema/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

export async function createQuotation(data, items, tx = db) {
    return await tx.transaction(async (innerTx) => {
        const [inserted] = await innerTx.insert(quotations).values(data).returning();
        const itemsData = items.map(item => ({ ...item, quotationId: inserted.id }));
        await innerTx.insert(quotationItems).values(itemsData);
        return inserted;
    });
}

export async function findQuotations({ customerId, vendorId, status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let cond = sql`1=1`;

    if (customerId) {
        cond = and(cond, eq(quotations.customerId, customerId));
    }

    if (vendorId) {
        // A vendor can see a quotation if it contains a product owned by them
        cond = and(cond, sql`EXISTS (
            SELECT 1 FROM ${quotationItems} qi
            JOIN ${products} p ON qi.product_id = p.id
            WHERE qi.quotation_id = ${quotations.id} AND p.vendor_id = ${vendorId}
        )`);
    }

    if (status) {
        cond = and(cond, eq(quotations.status, status));
    }

    const rows = await db.select()
        .from(quotations)
        .where(cond)
        .orderBy(desc(quotations.createdAt))
        .limit(limit)
        .offset(offset);

    return rows;
}

export async function findQuotationById(id, tx = db) {
    const q = await tx.select().from(quotations).where(eq(quotations.id, id));
    if (q.length === 0) return null;

    const items = await tx.select({
        id: quotationItems.id,
        productId: quotationItems.productId,
        variantId: quotationItems.variantId,
        quantity: quotationItems.quantity,
        rentalStart: quotationItems.rentalStart,
        rentalEnd: quotationItems.rentalEnd,
        pricePerUnit: quotationItems.pricePerUnit,
        subtotal: quotationItems.subtotal,
        productName: products.name,
        variantSku: productVariants.sku
    })
    .from(quotationItems)
    .innerJoin(products, eq(quotationItems.productId, products.id))
    .leftJoin(productVariants, eq(quotationItems.variantId, productVariants.id))
    .where(eq(quotationItems.quotationId, id));

    return { ...q[0], items };
}

export async function updateQuotation(id, updates, tx = db) {
    return tx.update(quotations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(quotations.id, id))
        .returning();
}

export async function deleteQuotationAndItems(id, tx = db) {
    await tx.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    return tx.delete(quotations).where(eq(quotations.id, id)).returning();
}

export async function updateQuotationItems(quotationId, items, tx = db) {
    await tx.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    const itemsData = items.map(item => ({ ...item, quotationId }));
    return tx.insert(quotationItems).values(itemsData).returning();
}
