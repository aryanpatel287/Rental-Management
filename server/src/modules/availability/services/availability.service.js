import * as availabilityRepo from '../repository/availability.repository.js';
import * as inventoryRepo from '../../inventory/repository/inventory.repository.js';
import { db } from '../../../config/database.js';
import { products, productVariants } from '../../../db/schema/schema.js';
import { eq } from 'drizzle-orm';

export async function checkAvailability({ productId, variantId, quantity, startDate, endDate }) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        throw new Error('INVALID_DATE_RANGE');
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (start < todayStart) {
        throw new Error('INVALID_DATE_RANGE');
    }
    if (quantity <= 0) {
        throw new Error('INVALID_QUANTITY');
    }

    // Check product exists and is rentable
    const prod = await db.select().from(products).where(eq(products.id, productId));
    if (!prod.length || !prod[0].isRentable) {
        throw new Error('PRODUCT_NOT_FOUND');
    }

    // Check variant if applicable
    if (variantId) {
        const variant = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
        if (!variant.length) {
            throw new Error('VARIANT_NOT_FOUND');
        }
    }

    const inv = await inventoryRepo.getInventoryRow(productId, variantId);
    if (!inv) {
        throw new Error('INVENTORY_NOT_FOUND');
    }

    // Rentable capacity = available + reserved + withCustomer
    const capacity = inv.availableQty + inv.reservedQty + inv.withCustomerQty;

    // Query active overlapping reservations
    const overlappingReservations = await availabilityRepo.getOverlappingReservations(productId, variantId, start, end);

    // Query active overlapping order items
    const overlappingOrders = await availabilityRepo.getOverlappingActiveOrders(productId, variantId, start, end);

    // Deduplicate overlaps using orderItemId / orderItem reference to avoid double-counting
    const commitmentsMap = new Map();

    for (const res of overlappingReservations) {
        const key = res.orderItemId || `res-${res.id}`;
        commitmentsMap.set(key, {
            start: new Date(res.reservedFrom),
            end: new Date(res.reservedTo),
            quantity: res.quantity
        });
    }

    for (const ord of overlappingOrders) {
        const key = ord.id; // orderItemId
        if (!commitmentsMap.has(key)) {
            commitmentsMap.set(key, {
                start: new Date(ord.rentalStart),
                end: new Date(ord.rentalEnd),
                quantity: ord.quantity
            });
        }
    }

    const commitments = Array.from(commitmentsMap.values());

    // Evaluate availability peak overlaps
    // Collect event endpoints
    const events = [];
    let initialReserved = 0;

    for (const commit of commitments) {
        // If reservation is already active at start
        if (commit.start <= start && commit.end > start) {
            initialReserved += commit.quantity;
        }
        
        // Capture internal events inside boundary
        if (commit.start > start && commit.start < end) {
            events.push({ time: commit.start.getTime(), change: commit.quantity });
        }
        if (commit.end > start && commit.end < end) {
            events.push({ time: commit.end.getTime(), change: -commit.quantity });
        }
    }

    // Check initial boundary
    let peak = initialReserved;
    if (initialReserved + quantity > capacity) {
        return {
            available: false,
            availableQty: Math.max(0, capacity - initialReserved),
            reason: 'RESERVATION_CONFLICT'
        };
    }

    // Sort events chronologically. If identical times, process decrements (-change) first
    events.sort((a, b) => {
        if (a.time === b.time) {
            return a.change - b.change; 
        }
        return a.time - b.time;
    });

    let runningCount = initialReserved;
    for (const evt of events) {
        runningCount += evt.change;
        if (runningCount > peak) {
            peak = runningCount;
        }
        if (runningCount + quantity > capacity) {
            return {
                available: false,
                availableQty: Math.max(0, capacity - peak),
                reason: 'RESERVATION_CONFLICT'
            };
        }
    }

    return {
        available: true,
        availableQty: capacity - peak
    };
}
