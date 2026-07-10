import { db } from '../config/database.js';
import { products } from '../db/schema/products.schema.js';
import { categories } from '../db/schema/categories.schema.js';
import { users } from '../db/schema/users.schema.js';
import { inventory } from '../db/schema/inventory.schema.js';
import { productVariants } from '../db/schema/variants.schema.js';
import { eq, and, or, gte, lte, ilike } from 'drizzle-orm';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createProduct(data) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
}

export async function getProductById(id) {
    const [product] = await db
        .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            isRentable: products.isRentable,
            published: products.published,
            costPrice: products.costPrice,
            salePrice: products.salePrice,
            stock: products.stock,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            vendorId: products.vendorId,
            categoryId: products.categoryId,
            category: {
                id: categories.id,
                name: categories.name,
                slug: categories.slug
            },
            vendor: {
                id: users.id,
                name: users.name,
                email: users.email
            }
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(users, eq(products.vendorId, users.id))
        .where(eq(products.id, id));
    return product || null;
}

export async function getProductBySlug(slug) {
    const [product] = await db
        .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            isRentable: products.isRentable,
            published: products.published,
            costPrice: products.costPrice,
            salePrice: products.salePrice,
            stock: products.stock,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            vendorId: products.vendorId,
            categoryId: products.categoryId,
            category: {
                id: categories.id,
                name: categories.name,
                slug: categories.slug
            },
            vendor: {
                id: users.id,
                name: users.name,
                email: users.email
            }
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(users, eq(products.vendorId, users.id))
        .where(eq(products.slug, slug));
    return product || null;
}

export async function getProducts(filters = {}) {
    const queryFilters = [];

    if (filters.published !== undefined) {
        queryFilters.push(eq(products.published, filters.published));
    }
    if (filters.vendorId !== undefined) {
        queryFilters.push(eq(products.vendorId, filters.vendorId));
    }
    if (filters.minPrice !== undefined) {
        queryFilters.push(gte(products.salePrice, filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
        queryFilters.push(lte(products.salePrice, filters.maxPrice));
    }
    if (filters.category !== undefined) {
        if (uuidRegex.test(filters.category)) {
            queryFilters.push(eq(products.categoryId, filters.category));
        } else {
            queryFilters.push(eq(categories.slug, filters.category));
        }
    }
    if (filters.search !== undefined && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.trim()}%`;
        queryFilters.push(or(
            ilike(products.name, searchTerm),
            ilike(products.description, searchTerm)
        ));
    }

    const query = db
        .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            isRentable: products.isRentable,
            published: products.published,
            costPrice: products.costPrice,
            salePrice: products.salePrice,
            stock: products.stock,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            vendorId: products.vendorId,
            categoryId: products.categoryId,
            category: {
                id: categories.id,
                name: categories.name,
                slug: categories.slug
            },
            vendor: {
                id: users.id,
                name: users.name,
                email: users.email
            }
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(users, eq(products.vendorId, users.id));

    if (queryFilters.length > 0) {
        return query.where(and(...queryFilters));
    }
    return query;
}

export async function updateProduct(id, updates) {
    const [product] = await db
        .update(products)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
    return product || null;
}

export async function deleteProduct(id) {
    const [product] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning();
    return product || null;
}

export async function getProductInventory(productId) {
    return await db.select().from(inventory).where(eq(inventory.productId, productId));
}

export async function getProductVariants(productId) {
    return await db.select().from(productVariants).where(eq(productVariants.productId, productId));
}
