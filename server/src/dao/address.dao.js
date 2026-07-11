import { db } from '../config/database.js';
import { addresses } from '../db/schema/addresses.schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Create a new address
 * @param {object} addressData
 * @param {object} tx
 */
export async function createAddress(addressData, tx = db) {
    const [address] = await tx.insert(addresses).values(addressData).returning();
    return address;
}

/**
 * Get address by ID
 * @param {string} id
 */
export async function getAddressById(id) {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, id));
    return address || null;
}

/**
 * Get all addresses of a specific user, sorted by isDefault desc and createdAt desc
 * @param {string} userId
 */
export async function getAddressesByUserId(userId) {
    return db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId));
}

/**
 * Update address details
 * @param {string} id
 * @param {object} updates
 * @param {object} tx
 */
export async function updateAddress(id, updates, tx = db) {
    const [address] = await tx
        .update(addresses)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(addresses.id, id))
        .returning();
    return address || null;
}

/**
 * Delete address (hard delete)
 * @param {string} id
 * @param {object} tx
 */
export async function deleteAddress(id, tx = db) {
    const [address] = await tx
        .delete(addresses)
        .where(eq(addresses.id, id))
        .returning();
    return address || null;
}

/**
 * Unset is_default flag for all addresses of a specific user
 * @param {string} userId
 * @param {object} tx
 */
export async function unsetDefaultAddresses(userId, tx = db) {
    return tx
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
}
