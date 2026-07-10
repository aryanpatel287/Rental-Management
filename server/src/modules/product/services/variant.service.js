import * as variantDao from '../../../dao/variant.dao.js';
import * as productDao from '../../../dao/product.dao.js';

function checkOwnership(product, currentUser) {
    if (currentUser.role === 'ADMIN') return;
    if (product.vendorId !== currentUser.id) {
        throw new Error('Forbidden: You do not own this product.');
    }
}

export async function createVariantService(productId, data, currentUser) {
    const product = await productDao.getProductById(productId);
    if (!product) {
        throw new Error('Product not found.');
    }

    checkOwnership(product, currentUser);

    const existingBySku = await variantDao.getVariantBySku(data.sku);
    if (existingBySku) {
        throw new Error('SKU is already in use.');
    }

    return await variantDao.createVariant({
        ...data,
        productId
    });
}

export async function getVariantsService(productId) {
    const product = await productDao.getProductById(productId);
    if (!product) {
        throw new Error('Product not found.');
    }
    return await variantDao.getVariantsByProductId(productId);
}

export async function updateVariantService(variantId, updates, currentUser) {
    const variant = await variantDao.getVariantById(variantId);
    if (!variant) {
        throw new Error('Product variant not found.');
    }

    const product = await productDao.getProductById(variant.productId);
    checkOwnership(product, currentUser);

    if (updates.sku && updates.sku !== variant.sku) {
        const existingBySku = await variantDao.getVariantBySku(updates.sku);
        if (existingBySku) {
            throw new Error('SKU is already in use.');
        }
    }

    return await variantDao.updateVariant(variantId, updates);
}

export async function deleteVariantService(variantId, currentUser) {
    const variant = await variantDao.getVariantById(variantId);
    if (!variant) {
        throw new Error('Product variant not found.');
    }

    const product = await productDao.getProductById(variant.productId);
    checkOwnership(product, currentUser);

    return await variantDao.deleteVariant(variantId);
}
