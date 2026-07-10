import { db } from '../../../config/database.js';
import { sql } from 'drizzle-orm';

/**
 * Sanitizes and validates a database identifier (table/column name)
 * to prevent SQL injection.
 * @param {string} name 
 * @returns {string}
 */
export function sanitizeIdentifier(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('Database identifier must be a non-empty string');
    }
    const cleanName = name.trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName)) {
        throw new Error(`Invalid database identifier: "${cleanName}". Only alphanumeric characters and underscores are allowed, starting with a letter or underscore.`);
    }
    return cleanName.toLowerCase();
}

/**
 * Maps field_type to PostgreSQL raw column type
 * @param {string} fieldType 
 * @returns {string}
 */
export function mapTypeToPg(fieldType) {
    switch (fieldType) {
        case 'number':
            return 'NUMERIC';
        case 'boolean':
            return 'BOOLEAN';
        case 'date':
            return 'TIMESTAMP WITH TIME ZONE';
        case 'text':
        case 'select':
        case 'email':
        case 'textarea':
        default:
            return 'TEXT';
    }
}

/**
 * Dynamically creates a table for an entity
 * @param {string} slug 
 * @param {Array<object>} fields 
 */
export async function createEntityTable(slug, fields) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;

    const columnsSql = fields.map(field => {
        const colName = sanitizeIdentifier(field.columnName);
        const colType = mapTypeToPg(field.fieldType);
        
        let constraints = '';
        if (field.required) {
            constraints += ' NOT NULL';
        }
        if (field.unique) {
            constraints += ' UNIQUE';
        }

        return `"${colName}" ${colType}${constraints}`;
    });

    // Add standard columns
    columnsSql.unshift('"id" UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    columnsSql.push('"is_deleted" BOOLEAN DEFAULT false NOT NULL');
    columnsSql.push('"deleted_at" TIMESTAMP WITH TIME ZONE');
    columnsSql.push('"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL');
    columnsSql.push('"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL');

    const sqlStatement = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columnsSql.join(',\n  ')}\n);`;

    try {
        await db.execute(sql.raw(sqlStatement));
        console.log(`Table "${tableName}" created successfully.`);
        return tableName;
    } catch (error) {
        console.error(`Error creating table "${tableName}":`, error);
        throw new Error(`Database table creation failed: ${error.message}`);
    }
}

/**
 * Dynamically drops a table for an entity
 * @param {string} slug 
 */
export async function dropEntityTable(slug) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;
    const sqlStatement = `DROP TABLE IF EXISTS "${tableName}" CASCADE;`;

    try {
        await db.execute(sql.raw(sqlStatement));
        console.log(`Table "${tableName}" dropped successfully.`);
        return tableName;
    } catch (error) {
        console.error(`Error dropping table "${tableName}":`, error);
        throw new Error(`Database table deletion failed: ${error.message}`);
    }
}

/**
 * Dynamically updates the schema of an entity table (Alters columns)
 * @param {string} slug 
 * @param {Array<object>} existingFields 
 * @param {Array<object>} newFields 
 */
export async function alterEntityTable(slug, existingFields, newFields) {
    const cleanSlug = sanitizeIdentifier(slug);
    const tableName = `crud_${cleanSlug}`;

    const existingMap = new Map(existingFields.map(f => [f.columnName, f]));
    const newMap = new Map(newFields.map(f => [f.columnName, f]));

    const alterStatements = [];

    // 1. Identify columns to drop
    for (const [colName, field] of existingMap.entries()) {
        if (!newMap.has(colName)) {
            const cleanColName = sanitizeIdentifier(colName);
            alterStatements.push(`DROP COLUMN IF EXISTS "${cleanColName}"`);
        }
    }

    // 2. Identify columns to add or modify
    for (const [colName, field] of newMap.entries()) {
        const cleanColName = sanitizeIdentifier(colName);
        const colType = mapTypeToPg(field.fieldType);
        
        if (!existingMap.has(colName)) {
            // Add new column
            let constraints = '';
            if (field.required) {
                constraints += ' NOT NULL';
            }
            if (field.unique) {
                constraints += ' UNIQUE';
            }
            alterStatements.push(`ADD COLUMN "${cleanColName}" ${colType}${constraints}`);
        } else {
            // Modify existing column type
            const oldField = existingMap.get(colName);
            if (oldField.fieldType !== field.fieldType) {
                alterStatements.push(`ALTER COLUMN "${cleanColName}" TYPE ${colType} USING "${cleanColName}"::${colType}`);
            }

            // Modify nullability
            if (oldField.required !== field.required) {
                if (field.required) {
                    alterStatements.push(`ALTER COLUMN "${cleanColName}" SET NOT NULL`);
                } else {
                    alterStatements.push(`ALTER COLUMN "${cleanColName}" DROP NOT NULL`);
                }
            }

            // Note: Altering uniqueness in standard Postgres requires dropping/adding constraints, 
            // which can be complex. For a hackathon starter kit, this is sufficient.
        }
    }

    if (alterStatements.length === 0) {
        return;
    }

    const sqlStatement = `ALTER TABLE "${tableName}"\n  ${alterStatements.join(',\n  ')};`;

    try {
        await db.execute(sql.raw(sqlStatement));
        console.log(`Table "${tableName}" schema updated successfully.`);
    } catch (error) {
        console.error(`Error altering table "${tableName}":`, error);
        throw new Error(`Database schema alteration failed: ${error.message}`);
    }
}
