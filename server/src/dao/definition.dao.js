import { db } from '../config/database.js';
import { entityDefinitions, fieldDefinitions } from '../db/schema/schema.js';
import { eq, asc } from 'drizzle-orm';

/**
 * Get entity definition by slug
 * @param {string} slug
 * @param {object} tx Optional transaction context
 */
export async function findEntityBySlug(slug, tx = db) {
    const [entity] = await tx
        .select()
        .from(entityDefinitions)
        .where(eq(entityDefinitions.slug, slug.toLowerCase()));
    return entity || null;
}

/**
 * Get fields for an entity by entity ID
 * @param {string} entityId
 * @param {object} tx Optional transaction context
 */
export async function findFieldsByEntityId(entityId, tx = db) {
    return tx
        .select()
        .from(fieldDefinitions)
        .where(eq(fieldDefinitions.entityId, entityId))
        .orderBy(asc(fieldDefinitions.sortOrder));
}

/**
 * Get all entities sorted by name
 * @param {object} tx Optional transaction context
 */
export async function findAllEntities(tx = db) {
    return tx.select().from(entityDefinitions).orderBy(asc(entityDefinitions.name));
}

/**
 * Insert a new entity definition
 * @param {object} entityData
 * @param {object} tx Optional transaction context
 */
export async function insertEntity(entityData, tx = db) {
    const [entity] = await tx.insert(entityDefinitions).values(entityData).returning();
    return entity;
}

/**
 * Insert multiple field definitions
 * @param {Array<object>} fieldsData
 * @param {object} tx Optional transaction context
 */
export async function insertFields(fieldsData, tx = db) {
    return tx.insert(fieldDefinitions).values(fieldsData).returning();
}

/**
 * Update an entity's metadata
 * @param {string} id
 * @param {object} updateData
 * @param {object} tx Optional transaction context
 */
export async function updateEntityMetadata(id, updateData, tx = db) {
    const [updated] = await tx
        .update(entityDefinitions)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(entityDefinitions.id, id))
        .returning();
    return updated;
}

/**
 * Delete all fields for an entity
 * @param {string} entityId
 * @param {object} tx Optional transaction context
 */
export async function deleteFieldsByEntityId(entityId, tx = db) {
    return tx.delete(fieldDefinitions).where(eq(fieldDefinitions.entityId, entityId));
}

/**
 * Delete an entity definition by slug
 * @param {string} slug
 * @param {object} tx Optional transaction context
 */
export async function deleteEntityBySlug(slug, tx = db) {
    return tx.delete(entityDefinitions).where(eq(entityDefinitions.slug, slug.toLowerCase()));
}
