import { db } from '../../../config/database.js';
import { auditLogs, products } from '../../../db/schema/schema.js';
import * as inventoryRepo from '../repository/inventory.repository.js';
import { eq } from 'drizzle-orm';

export async function getInventoryList(filters) {
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    return inventoryRepo.findInventory({
        page,
        limit,
        search: filters.search,
        vendorId: filters.vendorId,
        categoryId: filters.categoryId,
        status: filters.status
    });
}

export async function getProductInventory(productId) {
    const prod = await db.select().from(products).where(eq(products.id, productId));
    if (!prod.length) {
        throw new Error('PRODUCT_NOT_FOUND');
    }
    return inventoryRepo.findByProductId(productId);
}

export async function adjustInventory(productId, { action, quantity, variantId, reason, from }, user) {
    if (quantity <= 0) {
        throw new Error('INVALID_QUANTITY');
    }

    return db.transaction(async (tx) => {
        const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
        if (!row) {
            throw new Error('INVENTORY_NOT_FOUND');
        }

        const oldValue = { ...row };
        let updates = {};

        switch (action) {
            case 'increase':
                updates.availableQty = row.availableQty + quantity;
                break;
            case 'decrease':
                if (row.availableQty < quantity) {
                    throw new Error('INSUFFICIENT_STOCK');
                }
                updates.availableQty = row.availableQty - quantity;
                break;
            case 'maintenance':
                if (row.availableQty < quantity) {
                    throw new Error('INSUFFICIENT_STOCK');
                }
                updates.availableQty = row.availableQty - quantity;
                updates.maintenanceQty = row.maintenanceQty + quantity;
                break;
            case 'damaged':
                if (row.availableQty < quantity) {
                    throw new Error('INSUFFICIENT_STOCK');
                }
                updates.availableQty = row.availableQty - quantity;
                updates.damagedQty = row.damagedQty + quantity;
                break;
            case 'restore':
                if (from === 'maintenance') {
                    if (row.maintenanceQty < quantity) {
                        throw new Error('INSUFFICIENT_STOCK');
                    }
                    updates.maintenanceQty = row.maintenanceQty - quantity;
                } else if (from === 'damaged') {
                    if (row.damagedQty < quantity) {
                        throw new Error('INSUFFICIENT_STOCK');
                    }
                    updates.damagedQty = row.damagedQty - quantity;
                } else {
                    throw new Error('INVALID_ACTION');
                }
                updates.availableQty = row.availableQty + quantity;
                break;
            default:
                throw new Error('INVALID_ACTION');
        }

        const [updatedRow] = await inventoryRepo.updateInventoryRow(productId, variantId, updates, tx);

        // Log to audit log
        await tx.insert(auditLogs).values({
            userId: user ? user.id : null,
            action: `inventory_${action}`,
            entity: 'inventory',
            entityId: row.id,
            oldValue,
            newValue: updatedRow
        });

        return updatedRow;
    });
}

// --- Internal Service Methods ---
export async function reserveStock(productId, variantId, quantity, tx = db) {
    const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
    if (!row || row.availableQty < quantity) throw new Error('INSUFFICIENT_STOCK');
    return inventoryRepo.updateInventoryRow(productId, variantId, {
        availableQty: row.availableQty - quantity,
        reservedQty: row.reservedQty + quantity
    }, tx);
}

export async function releaseReservation(productId, variantId, quantity, tx = db) {
    const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
    if (!row || row.reservedQty < quantity) throw new Error('INSUFFICIENT_STOCK');
    return inventoryRepo.updateInventoryRow(productId, variantId, {
        availableQty: row.availableQty + quantity,
        reservedQty: row.reservedQty - quantity
    }, tx);
}

export async function moveToCustomer(productId, variantId, quantity, tx = db) {
    const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
    if (!row || row.reservedQty < quantity) throw new Error('INSUFFICIENT_STOCK');
    return inventoryRepo.updateInventoryRow(productId, variantId, {
        reservedQty: row.reservedQty - quantity,
        withCustomerQty: row.withCustomerQty + quantity
    }, tx);
}

export async function returnStock(productId, variantId, quantity, tx = db) {
    const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
    if (!row || row.withCustomerQty < quantity) throw new Error('INSUFFICIENT_STOCK');
    return inventoryRepo.updateInventoryRow(productId, variantId, {
        withCustomerQty: row.withCustomerQty - quantity,
        availableQty: row.availableQty + quantity
    }, tx);
}

export async function markMaintenance(productId, variantId, quantity, tx = db) {
    const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
    if (!row || row.availableQty < quantity) throw new Error('INSUFFICIENT_STOCK');
    return inventoryRepo.updateInventoryRow(productId, variantId, {
        availableQty: row.availableQty - quantity,
        maintenanceQty: row.maintenanceQty + quantity
    }, tx);
}

export async function restore(productId, variantId, quantity, fromType, tx = db) {
    const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
    if (!row) throw new Error('INVENTORY_NOT_FOUND');
    let updates = { availableQty: row.availableQty + quantity };
    if (fromType === 'maintenance') {
        if (row.maintenanceQty < quantity) throw new Error('INSUFFICIENT_STOCK');
        updates.maintenanceQty = row.maintenanceQty - quantity;
    } else if (fromType === 'damaged') {
        if (row.damagedQty < quantity) throw new Error('INSUFFICIENT_STOCK');
        updates.damagedQty = row.damagedQty - quantity;
    } else {
        throw new Error('INVALID_ACTION');
    }
    return inventoryRepo.updateInventoryRow(productId, variantId, updates, tx);
}

export async function markDamaged(productId, variantId, quantity, tx = db) {
    const row = await inventoryRepo.getInventoryRow(productId, variantId, tx);
    if (!row || row.availableQty < quantity) throw new Error('INSUFFICIENT_STOCK');
    return inventoryRepo.updateInventoryRow(productId, variantId, {
        availableQty: row.availableQty - quantity,
        damagedQty: row.damagedQty + quantity
    }, tx);
}
