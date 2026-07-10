import * as attributeDao from '../../../dao/attribute.dao.js';

export async function createAttributeService(data) {
    const { name } = data;
    const existing = await attributeDao.getAttributeByName(name);
    if (existing) {
        throw new Error('Attribute name is already in use.');
    }
    return await attributeDao.createAttribute(data);
}

export async function getAttributesService() {
    const attrs = await attributeDao.getAttributes();
    const result = [];

    for (const attr of attrs) {
        const vals = await attributeDao.getAttributeValuesByAttributeId(attr.id);
        result.push({
            ...attr,
            values: vals.map(v => ({ id: v.id, value: v.value }))
        });
    }

    return result;
}

export async function updateAttributeService(id, updates) {
    const attribute = await attributeDao.getAttributeById(id);
    if (!attribute) {
        throw new Error('Attribute not found.');
    }

    if (updates.name && updates.name !== attribute.name) {
        const existing = await attributeDao.getAttributeByName(updates.name);
        if (existing) {
            throw new Error('Attribute name is already in use.');
        }
    }

    return await attributeDao.updateAttribute(id, updates);
}

export async function deleteAttributeService(id) {
    const attribute = await attributeDao.getAttributeById(id);
    if (!attribute) {
        throw new Error('Attribute not found.');
    }
    return await attributeDao.deleteAttribute(id);
}
