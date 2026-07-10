import { db } from '../../../config/database.js';
import { createEntityTable, dropEntityTable, alterEntityTable } from './table-manager.service.js';
import * as definitionDAO from '../../../dao/definition.dao.js';

/**
 * Get entity and its field definitions by slug
 * @param {string} slug 
 */
export async function getEntityBySlug(slug) {
    const entity = await definitionDAO.findEntityBySlug(slug);
    if (!entity) return null;

    const fields = await definitionDAO.findFieldsByEntityId(entity.id);

    return {
        ...entity,
        fields
    };
}

/**
 * List all entity definitions
 */
export async function listEntities() {
    return definitionDAO.findAllEntities();
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
        const entity = await definitionDAO.insertEntity({
            name,
            slug: lowerSlug,
            tableName,
            description,
            isActive: true
        }, tx);

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

        const insertedFields = await definitionDAO.insertFields(fieldValues, tx);

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
        const updatedEntity = await definitionDAO.updateEntityMetadata(existing.id, {
            name: name || existing.name,
            description: description !== undefined ? description : existing.description
        }, tx);

        if (fields) {
            // Delete existing fields metadata first
            await definitionDAO.deleteFieldsByEntityId(existing.id, tx);

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

            const insertedFields = await definitionDAO.insertFields(fieldValues, tx);

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
        await definitionDAO.deleteEntityBySlug(lowerSlug, tx);

        return { slug: lowerSlug, success: true };
    });
}
