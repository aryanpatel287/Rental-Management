import * as userService from '../services/user.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Get current logged in user details
 */
export async function getMe(req, res, next) {
    try {
        const user = req.user;
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User retrieved successfully',
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update current user profile details
 */
export async function updateProfile(req, res, next) {
    try {
        const { name, email } = req.body;
        const updatedUser = await userService.updateProfile(req.user.id, { name, email });
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Profile updated successfully',
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    emailVerified: updatedUser.emailVerified,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Change current user password
 */
export async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user.id, { currentPassword, newPassword });
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Password changed successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Soft delete own user account
 */
export async function deleteAccount(req, res, next) {
    try {
        await userService.deleteAccount(req.user.id);
        res.clearCookie('token');

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Account deleted successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List all users (Admin only)
 */
export async function adminListUsers(req, res, next) {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const rawUsers = await userService.adminListUsers(includeDeleted);
        
        const users = rawUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isDeleted: user.isDeleted,
            deletedAt: user.deletedAt,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Users retrieved successfully',
            success: true,
            data: { users },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a specific user details by ID (Admin only)
 */
export async function adminGetUserById(req, res, next) {
    try {
        const user = await userService.adminGetUserById(req.params.id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User retrieved successfully',
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    isDeleted: user.isDeleted,
                    deletedAt: user.deletedAt,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update a user's role (Admin only)
 */
export async function adminUpdateRole(req, res, next) {
    try {
        const { role } = req.body;
        const updatedUser = await userService.adminUpdateRole(req.params.id, role);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User role updated successfully',
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    emailVerified: updatedUser.emailVerified,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Soft delete a user by ID (Admin only)
 */
export async function adminDeleteUser(req, res, next) {
    try {
        await userService.adminDeleteUser(req.params.id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User soft-deleted successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}
