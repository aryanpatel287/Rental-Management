import { sql } from 'drizzle-orm';
import { db } from '../../config/database.js';

/**
 * Generates a sequential, date-based number in the format PREFIX-YYYYMMDD-XXXXX.
 * @param {string} prefix e.g., 'QTN' or 'ORD'
 * @param {object} tableSchema Drizzle table schema object
 * @param {object} columnSchema Drizzle column schema object
 * @param {object} tx Optional transaction client
 * @returns {Promise<string>} e.g., 'QTN-20260711-00001'
 */
export async function generateNumber(prefix, tableSchema, columnSchema, tx = db) {
    const today = new Date();
    // Use local timezone or simple UTC date string
    // Format YYYYMMDD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}${mm}${dd}`;
    const pattern = `${prefix}-${todayStr}-%`;

    const countResult = await tx
        .select({ count: sql`COUNT(*)` })
        .from(tableSchema)
        .where(sql`${columnSchema} LIKE ${pattern}`);

    const count = Number(countResult[0]?.count || 0) + 1;
    const sequenceStr = String(count).padStart(5, '0');
    return `${prefix}-${todayStr}-${sequenceStr}`;
}
