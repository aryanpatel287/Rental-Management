import { db } from '../../../config/database.js';
import { reservations, rentalOrderItems, rentalOrders } from '../../../db/schema/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export async function getOverlappingReservations(productId, variantId, startDate, endDate) {
    let cond = and(
        eq(reservations.productId, productId),
        eq(reservations.status, 'Reserved'),
        sql`${reservations.reservedFrom} < ${endDate}`,
        sql`${reservations.reservedTo} > ${startDate}`
    );
    if (variantId) {
        cond = and(cond, eq(reservations.variantId, variantId));
    } else {
        cond = and(cond, sql`${reservations.variantId} IS NULL`);
    }
    return db.select().from(reservations).where(cond);
}

export async function getOverlappingActiveOrders(productId, variantId, startDate, endDate) {
    let cond = and(
        eq(rentalOrderItems.productId, productId),
        sql`${rentalOrders.status} IN ('Confirmed', 'PickedUp', 'Active')`,
        sql`${rentalOrderItems.rentalStart} < ${endDate}`,
        sql`${rentalOrderItems.rentalEnd} > ${startDate}`
    );
    if (variantId) {
        cond = and(cond, eq(rentalOrderItems.variantId, variantId));
    } else {
        cond = and(cond, sql`${rentalOrderItems.variantId} IS NULL`);
    }

    return db.select({
        id: rentalOrderItems.id,
        orderId: rentalOrderItems.orderId,
        productId: rentalOrderItems.productId,
        variantId: rentalOrderItems.variantId,
        quantity: rentalOrderItems.quantity,
        rentalStart: rentalOrderItems.rentalStart,
        rentalEnd: rentalOrderItems.rentalEnd
    })
    .from(rentalOrderItems)
    .innerJoin(rentalOrders, eq(rentalOrderItems.orderId, rentalOrders.id))
    .where(cond);
}
