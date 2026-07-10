import { pool } from '../config/database.js';
import { sanitizeIdentifier } from '../modules/crud/services/table-manager.service.js';

/**
 * Normalizes filter value for SQL queries
 * @param {string} type 
 * @param {string} value 
 */
function castFilterValue(type, value) {
    if (value === 'null' || value === '') return null;
    if (type === 'number') {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }
    if (type === 'boolean') {
        return value === 'true' || value === true;
    }
    if (type === 'date') {
        return new Date(value);
    }
    return value;
}

/**
 * Generic query to retrieve records from dynamic tables
 */
export async function findMany(slug, fields, options = {}) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;

    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(options.limit) || 10));
    const offset = (page - 1) * limit;

    const queryParts = [`SELECT * FROM "${tableName}" WHERE is_deleted = false`];
    const countParts = [`SELECT COUNT(*) FROM "${tableName}" WHERE is_deleted = false`];
    const values = [];
    let paramIndex = 1;

    // Apply filters matching valid fields
    const validFieldMap = new Map(fields.map(f => [f.columnName, f]));
    if (options.filters && typeof options.filters === 'object') {
        for (const [key, val] of Object.entries(options.filters)) {
            if (validFieldMap.has(key) && val !== undefined && val !== null && val !== '') {
                const field = validFieldMap.get(key);
                const colName = sanitizeIdentifier(key);
                const castValue = castFilterValue(field.fieldType, val);
                
                if (castValue !== null) {
                    const filterSql = ` AND "${colName}" = $${paramIndex}`;
                    queryParts.push(filterSql);
                    countParts.push(filterSql);
                    values.push(castValue);
                    paramIndex++;
                }
            }
        }
    }

    // Apply Sorting
    let sortCol = 'created_at';
    let sortDir = 'DESC';

    if (options.sortBy && validFieldMap.has(options.sortBy)) {
        sortCol = sanitizeIdentifier(options.sortBy);
    }
    if (options.sortOrder && ['ASC', 'DESC'].includes(options.sortOrder.toUpperCase())) {
        sortDir = options.sortOrder.toUpperCase();
    }
    
    queryParts.push(` ORDER BY "${sortCol}" ${sortDir}`);

    // Pagination
    queryParts.push(` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`);
    const selectValues = [...values, limit, offset];

    const selectQuery = queryParts.join('');
    const countQuery = countParts.join('');

    const [dataResult, countResult] = await Promise.all([
        pool.query(selectQuery, selectValues),
        pool.query(countQuery, values)
    ]);

    const records = dataResult.rows || [];
    const totalRecords = parseInt(countResult.rows[0]?.count || 0, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
        records,
        pagination: {
            page,
            limit,
            totalRecords,
            totalPages
        }
    };
}

/**
 * Retrieve a single record from a dynamic table
 */
export async function findById(slug, id) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;
    const sql = `SELECT * FROM "${tableName}" WHERE id = $1 AND is_deleted = false LIMIT 1`;

    const result = await pool.query(sql, [id]);
    return result.rows[0] || null;
}

/**
 * Create a new record in a dynamic table
 */
export async function createOne(slug, data, fields) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;

    const cols = [];
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    const validFieldMap = new Map(fields.map(f => [f.columnName, f]));

    for (const [key, val] of Object.entries(data)) {
        if (validFieldMap.has(key)) {
            const field = validFieldMap.get(key);
            const colName = sanitizeIdentifier(key);
            const castValue = castFilterValue(field.fieldType, val);

            cols.push(`"${colName}"`);
            placeholders.push(`$${paramIndex}`);
            values.push(castValue);
            paramIndex++;
        }
    }

    if (cols.length === 0) {
        throw new Error('No valid field values provided for insertion');
    }

    const sql = `INSERT INTO "${tableName}" (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

    const result = await pool.query(sql, values);
    return result.rows[0];
}

/**
 * Update an existing record in a dynamic table
 */
export async function updateOne(slug, id, data, fields) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;

    const setStatements = [];
    const values = [];
    let paramIndex = 1;

    const validFieldMap = new Map(fields.map(f => [f.columnName, f]));

    for (const [key, val] of Object.entries(data)) {
        if (validFieldMap.has(key)) {
            const field = validFieldMap.get(key);
            const colName = sanitizeIdentifier(key);
            const castValue = castFilterValue(field.fieldType, val);

            setStatements.push(`"${colName}" = $${paramIndex}`);
            values.push(castValue);
            paramIndex++;
        }
    }

    if (setStatements.length === 0) {
        throw new Error('No valid field values provided for update');
    }

    // Append id to query args
    values.push(id);
    const idParamIndex = paramIndex;
    
    const sql = `UPDATE "${tableName}" SET ${setStatements.join(', ')}, updated_at = NOW() WHERE id = $${idParamIndex} AND is_deleted = false RETURNING *`;

    const result = await pool.query(sql, values);
    return result.rows[0] || null;
}

/**
 * Soft delete a record in a dynamic table
 */
export async function softDelete(slug, id) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;
    const sql = `UPDATE "${tableName}" SET is_deleted = true, deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND is_deleted = false RETURNING *`;

    const result = await pool.query(sql, [id]);
    return result.rows[0] || null;
}
