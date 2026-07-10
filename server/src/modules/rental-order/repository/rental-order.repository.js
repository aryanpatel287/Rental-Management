import { db } from '../../../config/database.js';
import { rentalOrders, rentalOrderItems, products, productVariants, reservations } from '../../../db/schema/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

export async function create(orderData, tx = db) {
    const [inserted] = await tx.insert(rentalOrders).values(orderData).returning();
    return inserted;
}

export async function createItems(itemsData, tx = db) {
    return tx.insert(rentalOrderItems).values(itemsData).returning();
}

export async function findOrders({ customerId, vendorId, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let cond = sql`1=1`;

    if (customerId) {
        cond = and(cond, eq(rentalOrders.customerId, customerId));
    }

    if (vendorId) {
        cond = and(cond, sql`EXISTS (
            SELECT 1 FROM ${rentalOrderItems} roi
            JOIN ${products} p ON roi.product_id = p.id
            WHERE roi.order_id = ${rentalOrders.id} AND p.vendor_id = ${vendorId}
        )`);
    }

    return db.select()
        .from(rentalOrders)
        .where(cond)
        .orderBy(desc(rentalOrders.createdAt))
        .limit(limit)
        .offset(offset);
}

export async function findById(id, tx = db) {
    const orders = await tx.select().from(rentalOrders).where(eq(rentalOrders.id, id));
    if (orders.length === 0) return null;

    const items = await tx.select({
        id: rentalOrderItems.id,
        productId: rentalOrderItems.productId,
        variantId: rentalOrderItems.variantId,
        quantity: rentalOrderItems.quantity,
        pricePerUnit: rentalOrderItems.pricePerUnit,
        rentalStart: rentalOrderItems.rentalStart,
        rentalEnd: rentalOrderItems.rentalEnd,
        subtotal: rentalOrderItems.subtotal,
        productName: products.name,
        variantSku: productVariants.sku
    })
    .from(rentalOrderItems)
    .innerJoin(products, eq(rentalOrderItems.productId, products.id))
    .leftJoin(productVariants, eq(rentalOrderItems.variantId, productVariants.id))
    .where(eq(rentalOrderItems.orderId, id));

    return { ...orders[0], items };
}

export async function update(id, updates, tx = db) {
    return tx.update(rentalOrders)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(rentalOrders.id, id))
        .returning();
}

export async function getOrderReservations(orderId, tx = db) {
    return tx.select({
        id: reservations.id,
        orderItemId: reservations.orderItemId,
        productId: reservations.productId,
        variantId: reservations.variantId,
        quantity: reservations.quantity
    })
    .from(reservations)
    .innerJoin(rentalOrderItems, eq(reservations.orderItemId, rentalOrderItems.id))
    .where(and(
        eq(rentalOrderItems.orderId, orderId),
        eq(reservations.status, 'Reserved')
    ));
}
