import { db } from '../config/database.js';
import { attributes, attributeValues } from '../db/schema/attributes.schema.js';
import { eq } from 'drizzle-orm';

export async function createAttribute(data) {
    const [attribute] = await db.insert(attributes).values(data).returning();
    return attribute;
}

export async function getAttributeById(id) {
    const [attribute] = await db
        .select()
        .from(attributes)
        .where(eq(attributes.id, id));
    return attribute || null;
}

export async function getAttributeByName(name) {
    const [attribute] = await db
        .select()
        .from(attributes)
        .where(eq(attributes.name, name));
    return attribute || null;
}

export async function getAttributes() {
    return await db.select().from(attributes);
}

export async function updateAttribute(id, updates) {
    const [attribute] = await db
        .update(attributes)
        .set(updates)
        .where(eq(attributes.id, id))
        .returning();
    return attribute || null;
}

export async function deleteAttribute(id) {
    const [attribute] = await db
        .delete(attributes)
        .where(eq(attributes.id, id))
        .returning();
    return attribute || null;
}

export async function createAttributeValue(data) {
    const [val] = await db.insert(attributeValues).values(data).returning();
    return val;
}

export async function getAttributeValuesByAttributeId(attributeId) {
    return await db
        .select()
        .from(attributeValues)
        .where(eq(attributeValues.attributeId, attributeId));
}
