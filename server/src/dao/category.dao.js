import { db } from '../config/database.js';
import { categories } from '../db/schema/categories.schema.js';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Create a new category
 * @param {object} data
 */
export async function createCategory(data) {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
}

/**
 * Get category by ID
 * @param {string} id
 */
export async function getCategoryById(id) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || null;
}

/**
 * Get category by Slug
 * @param {string} slug
 */
export async function getCategoryBySlug(slug) {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || null;
}

/**
 * Get all categories matching filters
 * @param {object} filters
 */
export async function getCategories(filters = {}) {
    const queryFilters = [];
    
    if (filters.isActive !== undefined) {
        queryFilters.push(eq(categories.isActive, filters.isActive));
    }
    if (filters.parentCategoryId !== undefined) {
        if (filters.parentCategoryId === null || filters.parentCategoryId === 'null') {
            queryFilters.push(isNull(categories.parentCategoryId));
        } else {
            queryFilters.push(eq(categories.parentCategoryId, filters.parentCategoryId));
        }
    }
    if (filters.slug !== undefined) {
        queryFilters.push(eq(categories.slug, filters.slug));
    }

    if (queryFilters.length > 0) {
        return db.select().from(categories).where(and(...queryFilters));
    }
    return db.select().from(categories);
}

/**
 * Update category details
 * @param {string} id
 * @param {object} updates
 */
export async function updateCategory(id, updates) {
    const [category] = await db
        .update(categories)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();
    return category || null;
}

/**
 * Hard delete category
 * @param {string} id
 */
export async function deleteCategory(id) {
    const [category] = await db
        .delete(categories)
        .where(eq(categories.id, id))
        .returning();
    return category || null;
}
