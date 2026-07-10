import * as categoryDao from '../../../dao/category.dao.js';

/**
 * Format string to slug format (kebab-case)
 * @param {string} text
 */
export function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
        .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}

/**
 * Recursively checks if setting targetParentId as parent of categoryId creates a cycle.
 * @param {string} categoryId
 * @param {string} targetParentId
 */
export async function wouldCreateCycle(categoryId, targetParentId) {
    if (!targetParentId) return false;
    if (categoryId === targetParentId) return true;

    let currentParentId = targetParentId;
    while (currentParentId) {
        const parent = await categoryDao.getCategoryById(currentParentId);
        if (!parent) break;
        
        if (parent.parentCategoryId === categoryId) {
            return true; // Cycle detected
        }
        currentParentId = parent.parentCategoryId;
    }
    return false;
}

export async function createCategoryService(data) {
    const { name, parentCategoryId } = data;
    let { slug } = data;

    // Slug generation
    if (!slug || slug.trim() === '') {
        slug = slugify(name);
    } else {
        slug = slugify(slug);
    }

    // Slug uniqueness check
    const existingBySlug = await categoryDao.getCategoryBySlug(slug);
    if (existingBySlug) {
        throw new Error('Category slug is already in use.');
    }

    // Check parent exists
    if (parentCategoryId) {
        const parent = await categoryDao.getCategoryById(parentCategoryId);
        if (!parent) {
            throw new Error('Parent category does not exist.');
        }
    }

    return await categoryDao.createCategory({
        ...data,
        slug,
    });
}

export async function getCategoriesService(filters = {}) {
    return await categoryDao.getCategories(filters);
}

export async function getCategoryByIdService(id) {
    const category = await categoryDao.getCategoryById(id);
    if (!category) {
        throw new Error('Category not found.');
    }
    return category;
}

export async function updateCategoryService(id, updates) {
    // Check if category exists
    const category = await categoryDao.getCategoryById(id);
    if (!category) {
        throw new Error('Category not found.');
    }

    const { name, parentCategoryId, slug, isActive } = updates;
    const patchData = {};

    if (name !== undefined) patchData.name = name;
    if (isActive !== undefined) patchData.isActive = isActive;
    if (updates.description !== undefined) patchData.description = updates.description;

    // Handle slug update
    if (slug !== undefined && slug.trim() !== '') {
        const formattedSlug = slugify(slug);
        if (formattedSlug !== category.slug) {
            const existingBySlug = await categoryDao.getCategoryBySlug(formattedSlug);
            if (existingBySlug) {
                throw new Error('Category slug is already in use.');
            }
            patchData.slug = formattedSlug;
        }
    } else if (name !== undefined && name !== category.name && (!slug || slug.trim() === '')) {
        // If name changes and slug is not provided, regenerate slug
        const formattedSlug = slugify(name);
        if (formattedSlug !== category.slug) {
            const existingBySlug = await categoryDao.getCategoryBySlug(formattedSlug);
            if (existingBySlug) {
                throw new Error('Category slug is already in use.');
            }
            patchData.slug = formattedSlug;
        }
    }

    // Handle parent change
    if (parentCategoryId !== undefined) {
        if (parentCategoryId === null || parentCategoryId === '') {
            patchData.parentCategoryId = null;
        } else {
            if (parentCategoryId === id) {
                throw new Error('A category cannot be its own parent.');
            }

            const parent = await categoryDao.getCategoryById(parentCategoryId);
            if (!parent) {
                throw new Error('Parent category does not exist.');
            }

            // Cycle check
            const hasCycle = await wouldCreateCycle(id, parentCategoryId);
            if (hasCycle) {
                throw new Error('Circular dependency detected: Parent category cannot be a descendant of this category.');
            }
            patchData.parentCategoryId = parentCategoryId;
        }
    }

    return await categoryDao.updateCategory(id, patchData);
}

export async function deleteCategoryService(id) {
    const category = await categoryDao.getCategoryById(id);
    if (!category) {
        throw new Error('Category not found.');
    }

    return await categoryDao.deleteCategory(id);
}
