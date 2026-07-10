import { db } from '../../../config/database.js';
import { reservations } from '../../../db/schema/schema.js';
import { eq } from 'drizzle-orm';

export async function create(data, tx = db) {
    const [inserted] = await tx.insert(reservations).values(data).returning();
    return inserted;
}

export async function updateStatus(id, status, tx = db) {
    return tx.update(reservations)
        .set({ status })
        .where(eq(reservations.id, id))
        .returning();
}

export async function findById(id) {
    const records = await db.select().from(reservations).where(eq(reservations.id, id));
    return records[0] || null;
}
