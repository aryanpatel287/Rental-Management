import { db } from '../../../config/database.js';
import { entityDefinitions, fieldDefinitions } from '../schema/crud.schema.js';
import { eq, asc } from 'drizzle-orm';
import { createEntityTable, dropEntityTable, alterEntityTable } from './table-manager.service.js';

/**
 * Get entity and its field definitions by slug
 * @param {string} slug 
 */
export async function getEntityBySlug(slug) {
    const [entity] = await db
        .select()
        .from(entityDefinitions)
        .where(eq(entityDefinitions.slug, slug.toLowerCase()));
        
    if (!entity) return null;

    const fields = await db
        .select()
        .from(fieldDefinitions)
        .where(eq(fieldDefinitions.entityId, entity.id))
        .orderBy(asc(fieldDefinitions.sortOrder));

    return {
        ...entity,
        fields
    };
}

/**
 * List all entity definitions
 */
export async function listEntities() {
    return db.select().from(entityDefinitions).orderBy(asc(entityDefinitions.name));
}

/**
 * Define a new entity dynamic schema and build its table
 */
export async function createEntity(entityData) {
    const { name, slug, description, fields } = entityData;
    const lowerSlug = slug.toLowerCase();
    const tableName = `crud_${lowerSlug}`;

    return db.transaction(async (tx) => {
        // 1. Insert entity definition metadata
        const [entity] = await tx
            .insert(entityDefinitions)
            .values({
                name,
                slug: lowerSlug,
                tableName,
                description,
                isActive: true
            })
            .returning();

        // 2. Insert fields metadata
        const fieldValues = fields.map((f, index) => ({
            entityId: entity.id,
            name: f.name,
            columnName: f.columnName.toLowerCase(),
            fieldType: f.fieldType,
            required: !!f.required,
            unique: !!f.unique,
            defaultValue: f.defaultValue || null,
            options: f.options || null,
            validation: f.validation || null,
            uiConfig: f.uiConfig || null,
            sortOrder: f.sortOrder ?? index
        }));

        const insertedFields = await tx
            .insert(fieldDefinitions)
            .values(fieldValues)
            .returning();

        // 3. Create physical database table
        await createEntityTable(lowerSlug, fieldValues);

        return {
            ...entity,
            fields: insertedFields
        };
    });
}

/**
 * Update an entity's metadata and structure
 */
export async function updateEntity(slug, updateData) {
    const lowerSlug = slug.toLowerCase();
    const existing = await getEntityBySlug(lowerSlug);
    if (!existing) {
        throw new Error(`Entity "${slug}" not found`);
    }

    const { name, description, fields } = updateData;

    return db.transaction(async (tx) => {
        // 1. Update main definition metadata
        const [updatedEntity] = await tx
            .update(entityDefinitions)
            .set({
                name: name || existing.name,
                description: description !== undefined ? description : existing.description,
                updatedAt: new Date()
            })
            .where(eq(entityDefinitions.id, existing.id))
            .returning();

        if (fields) {
            // Delete existing fields metadata first
            await tx
                .delete(fieldDefinitions)
                .where(eq(fieldDefinitions.entityId, existing.id));

            // Insert new fields metadata
            const fieldValues = fields.map((f, index) => ({
                entityId: existing.id,
                name: f.name,
                columnName: f.columnName.toLowerCase(),
                fieldType: f.fieldType,
                required: !!f.required,
                unique: !!f.unique,
                defaultValue: f.defaultValue || null,
                options: f.options || null,
                validation: f.validation || null,
                uiConfig: f.uiConfig || null,
                sortOrder: f.sortOrder ?? index
            }));

            const insertedFields = await tx
                .insert(fieldDefinitions)
                .values(fieldValues)
                .returning();

            // Run database migration to alter table schema
            await alterEntityTable(lowerSlug, existing.fields, fieldValues);

            return {
                ...updatedEntity,
                fields: insertedFields
            };
        }

        return {
            ...updatedEntity,
            fields: existing.fields
        };
    });
}

/**
 * Drop entity schema and drop its physical table
 */
export async function deleteEntity(slug) {
    const lowerSlug = slug.toLowerCase();
    const existing = await getEntityBySlug(lowerSlug);
    if (!existing) {
        throw new Error(`Entity "${slug}" not found`);
    }

    return db.transaction(async (tx) => {
        // 1. Drop physical table
        await dropEntityTable(lowerSlug);

        // 2. Delete definition metadata (will cascade delete field definitions in DB)
        await tx
            .delete(entityDefinitions)
            .where(eq(entityDefinitions.id, existing.id));

        return { slug: lowerSlug, success: true };
    });
}
