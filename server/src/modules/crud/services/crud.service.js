import * as crudDAO from '../../../dao/crud.dao.js';

/**
 * Generic query to retrieve records from dynamic tables
 */
export async function findMany(slug, fields, options = {}) {
    try {
        return await crudDAO.findMany(slug, fields, options);
    } catch (error) {
        console.error(`Error querying table "crud_${slug}":`, error);
        throw new Error(`Failed to fetch records: ${error.message}`);
    }
}

/**
 * Retrieve a single record from a dynamic table
 */
export async function findById(slug, id) {
    try {
        return await crudDAO.findById(slug, id);
    } catch (error) {
        console.error(`Error querying record by ID in "crud_${slug}":`, error);
        throw new Error(`Failed to find record: ${error.message}`);
    }
}

/**
 * Create a new record in a dynamic table
 */
export async function createOne(slug, data, fields) {
    try {
        return await crudDAO.createOne(slug, data, fields);
    } catch (error) {
        console.error(`Error inserting record in "crud_${slug}":`, error);
        throw new Error(`Failed to create record: ${error.message}`);
    }
}

/**
 * Update an existing record in a dynamic table
 */
export async function updateOne(slug, id, data, fields) {
    try {
        return await crudDAO.updateOne(slug, id, data, fields);
    } catch (error) {
        console.error(`Error updating record in "crud_${slug}":`, error);
        throw new Error(`Failed to update record: ${error.message}`);
    }
}

/**
 * Soft delete a record in a dynamic table
 */
export async function softDelete(slug, id) {
    try {
        return await crudDAO.softDelete(slug, id);
    } catch (error) {
        console.error(`Error soft deleting record in "crud_${slug}":`, error);
        throw new Error(`Failed to delete record: ${error.message}`);
    }
}

