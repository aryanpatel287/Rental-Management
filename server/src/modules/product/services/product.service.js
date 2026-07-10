import * as productDao from '../../../dao/product.dao.js';
import * as categoryDao from '../../../dao/category.dao.js';
import { slugify } from '../../category/services/category.service.js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkOwnership(product, currentUser) {
    if (currentUser.role === 'ADMIN') return;
    if (product.vendorId !== currentUser.id) {
        throw new Error('Forbidden: You do not own this product.');
    }
}

export async function createProductService(data, currentUser) {
    const { name, categoryId } = data;
    let { slug } = data;

    // Validate category exists
    const category = await categoryDao.getCategoryById(categoryId);
    if (!category) {
        throw new Error('Category does not exist.');
    }

    // Slug generation
    if (!slug || slug.trim() === '') {
        slug = slugify(name);
    } else {
        slug = slugify(slug);
    }

    const existingBySlug = await productDao.getProductBySlug(slug);
    if (existingBySlug) {
        throw new Error('Product slug is already in use.');
    }

    return await productDao.createProduct({
        ...data,
        slug,
        vendorId: currentUser.id,
    });
}

export async function getProductsService(filters, currentUser) {
    const parsedFilters = { ...filters };

    // Standard customers/public see only published products
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'VENDOR')) {
        parsedFilters.published = true;
    }

    return await productDao.getProducts(parsedFilters);
}

export async function getProductByIdOrSlugService(idOrSlug) {
    let product;
    if (uuidRegex.test(idOrSlug)) {
        product = await productDao.getProductById(idOrSlug);
    } else {
        product = await productDao.getProductBySlug(idOrSlug);
    }

    if (!product) {
        throw new Error('Product not found.');
    }
    return product;
}

export async function updateProductService(id, updates, currentUser) {
    const product = await productDao.getProductById(id);
    if (!product) {
        throw new Error('Product not found.');
    }

    checkOwnership(product, currentUser);

    const { name, categoryId, slug } = updates;
    const patchData = { ...updates };

    if (categoryId !== undefined) {
        const category = await categoryDao.getCategoryById(categoryId);
        if (!category) {
            throw new Error('Category does not exist.');
        }
    }

    if (slug !== undefined && slug.trim() !== '') {
        const formattedSlug = slugify(slug);
        if (formattedSlug !== product.slug) {
            const existingBySlug = await productDao.getProductBySlug(formattedSlug);
            if (existingBySlug) {
                throw new Error('Product slug is already in use.');
            }
            patchData.slug = formattedSlug;
        }
    } else if (name !== undefined && name !== product.name) {
        const formattedSlug = slugify(name);
        if (formattedSlug !== product.slug) {
            const existingBySlug = await productDao.getProductBySlug(formattedSlug);
            if (existingBySlug) {
                throw new Error('Product slug is already in use.');
            }
            patchData.slug = formattedSlug;
        }
    }

    return await productDao.updateProduct(id, patchData);
}

export async function deleteProductService(id, currentUser) {
    const product = await productDao.getProductById(id);
    if (!product) {
        throw new Error('Product not found.');
    }

    checkOwnership(product, currentUser);

    return await productDao.deleteProduct(id);
}

export async function publishProductService(id, published, currentUser) {
    const product = await productDao.getProductById(id);
    if (!product) {
        throw new Error('Product not found.');
    }

    checkOwnership(product, currentUser);

    return await productDao.updateProduct(id, { published });
}

export async function getProductAvailabilityService(id) {
    const product = await productDao.getProductById(id);
    if (!product) {
        throw new Error('Product not found.');
    }

    const inventoryRecords = await productDao.getProductInventory(id);
    const variantsRecords = await productDao.getProductVariants(id);

    // Aggregate inventory stats
    const inventoryStats = {
        availableQty: 0,
        reservedQty: 0,
        withCustomerQty: 0,
        maintenanceQty: 0,
        damagedQty: 0
    };

    inventoryRecords.forEach(record => {
        inventoryStats.availableQty += record.availableQty;
        inventoryStats.reservedQty += record.reservedQty;
        inventoryStats.withCustomerQty += record.withCustomerQty;
        inventoryStats.maintenanceQty += record.maintenanceQty;
        inventoryStats.damagedQty += record.damagedQty;
    });

    // Match variant inventory details
    const variantsDetails = variantsRecords.map(variant => {
        const variantInventory = inventoryRecords.find(inv => inv.variantId === variant.id) || {
            availableQty: 0,
            reservedQty: 0,
            withCustomerQty: 0,
            maintenanceQty: 0,
            damagedQty: 0
        };

        return {
            variantId: variant.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            availableQty: variantInventory.availableQty,
            reservedQty: variantInventory.reservedQty,
            withCustomerQty: variantInventory.withCustomerQty,
            maintenanceQty: variantInventory.maintenanceQty,
            damagedQty: variantInventory.damagedQty
        };
    });

    return {
        productId: product.id,
        name: product.name,
        stock: product.stock,
        isRentable: product.isRentable,
        published: product.published,
        inventory: inventoryStats,
        variants: variantsDetails
    };
}
