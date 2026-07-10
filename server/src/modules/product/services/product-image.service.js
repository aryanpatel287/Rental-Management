import * as productImageDao from '../../../dao/product-image.dao.js';
import * as productDao from '../../../dao/product.dao.js';

function checkOwnership(product, currentUser) {
    if (currentUser.role === 'ADMIN') return;
    if (product.vendorId !== currentUser.id) {
        throw new Error('Forbidden: You do not own this product.');
    }
}

export async function createProductImageService(productId, data, currentUser) {
    const product = await productDao.getProductById(productId);
    if (!product) {
        throw new Error('Product not found.');
    }

    checkOwnership(product, currentUser);

    const existingImages = await productImageDao.getProductImagesByProductId(productId);
    let { isPrimary } = data;

    // Rules:
    // 1. If first image, default to primary
    // 2. If new image is primary, set all others to non-primary
    if (existingImages.length === 0) {
        isPrimary = true;
    } else if (isPrimary) {
        const updatePromises = existingImages
            .filter(img => img.isPrimary)
            .map(img => productImageDao.updateProductImage(img.id, { isPrimary: false }));
        await Promise.all(updatePromises);
    }

    return await productImageDao.createProductImage({
        productId,
        url: data.url,
        isPrimary: !!isPrimary
    });
}

export async function deleteProductImageService(productId, imageId, currentUser) {
    const product = await productDao.getProductById(productId);
    if (!product) {
        throw new Error('Product not found.');
    }

    checkOwnership(product, currentUser);

    const image = await productImageDao.getProductImageById(imageId);
    if (!image || image.productId !== productId) {
        throw new Error('Product image not found or does not belong to this product.');
    }

    await productImageDao.deleteProductImage(imageId);

    // Rule: If deleted image was primary, promote next oldest remaining image to primary
    if (image.isPrimary) {
        const remainingImages = await productImageDao.getProductImagesByProductId(productId);
        if (remainingImages.length > 0) {
            // Sort by createdAt ascending (oldest first)
            remainingImages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            await productImageDao.updateProductImage(remainingImages[0].id, { isPrimary: true });
        }
    }
}
