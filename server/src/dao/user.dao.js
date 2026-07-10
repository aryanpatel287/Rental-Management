import { db } from '../config/database.js';
import { users } from '../db/schema/users.schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Get user by email
 * @param {string} email
 * @param {boolean} includeDeleted
 */
export async function getUserByEmail(email, includeDeleted = false) {
    const filters = [eq(users.email, email)];
    if (!includeDeleted) {
        filters.push(eq(users.isDeleted, false));
    }
    const [user] = await db.select().from(users).where(and(...filters));
    return user || null;
}

/**
 * Get user by ID
 * @param {string} id
 * @param {boolean} includeDeleted
 */
export async function getUserById(id, includeDeleted = false) {
    const filters = [eq(users.id, id)];
    if (!includeDeleted) {
        filters.push(eq(users.isDeleted, false));
    }
    const [user] = await db.select().from(users).where(and(...filters));
    return user || null;
}

/**
 * Create a new user record
 * @param {object} userData
 */
export async function createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
}

/**
 * Update user details
 * @param {string} id
 * @param {object} updates
 */
export async function updateUser(id, updates) {
    const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(users.id, id), eq(users.isDeleted, false)))
        .returning();
    return user || null;
}

/**
 * Soft delete user
 * @param {string} id
 */
export async function softDeleteUser(id) {
    const [user] = await db
        .update(users)
        .set({
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(and(eq(users.id, id), eq(users.isDeleted, false)))
        .returning();
    return user || null;
}

/**
 * List all users
 * @param {boolean} includeDeleted
 */
export async function listUsers(includeDeleted = false) {
    if (includeDeleted) {
        return db.select().from(users);
    }
    return db.select().from(users).where(eq(users.isDeleted, false));
}
