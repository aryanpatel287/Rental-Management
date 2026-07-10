import * as categoryService from '../services/category.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function getCategories(req, res) {
    try {
        const { parentCategoryId, isActive, slug } = req.query;
        
        const filters = {};
        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }
        if (parentCategoryId !== undefined) {
            filters.parentCategoryId = parentCategoryId;
        }
        if (slug !== undefined) {
            filters.slug = slug;
        }

        const categoriesList = await categoryService.getCategoriesService(filters);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Categories retrieved successfully',
            success: true,
            data: { categories: categoriesList }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error while fetching categories',
            success: false,
            error: error.message
        });
    }
}

export async function createCategory(req, res) {
    try {
        const newCategory = await categoryService.createCategoryService(req.body);
        
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Category created successfully',
            success: true,
            data: { category: newCategory }
        });
    } catch (error) {
        console.error('Error creating category:', error);
        const statusCode = error.message.includes('already in use') || error.message.includes('does not exist') ? 400 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while creating category',
            success: false,
            error: error.message
        });
    }
}

export async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const updatedCategory = await categoryService.updateCategoryService(id, req.body);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Category updated successfully',
            success: true,
            data: { category: updatedCategory }
        });
    } catch (error) {
        console.error('Error updating category:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (
            error.message.includes('already in use') || 
            error.message.includes('own parent') || 
            error.message.includes('does not exist') ||
            error.message.includes('Circular dependency')
        ) {
            statusCode = 400;
        }
        
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while updating category',
            success: false,
            error: error.message
        });
    }
}

export async function deleteCategory(req, res) {
    try {
        const { id } = req.params;
        await categoryService.deleteCategoryService(id);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Category deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while deleting category',
            success: false,
            error: error.message
        });
    }
}
