import { db } from '../../../config/database.js';
import { 
    getUserWithProfileById, 
    updateUserWithProfile, 
    softDeleteUser, 
    listUsersWithProfiles,
    getUserWithProfileByEmail
} from '../../../dao/user.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * List all users with profiles (Admin only)
 */
export async function listUsers(req, res, next) {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const roleFilter = req.query.role || null;
        
        const users = await listUsersWithProfiles(includeDeleted, roleFilter);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Users retrieved successfully',
            success: true,
            data: { users },
            users
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all vendors (role = VENDOR)
 */
export async function getVendors(req, res, next) {
    try {
        const vendors = await listUsersWithProfiles(false, 'VENDOR');
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Vendors retrieved successfully',
            success: true,
            data: { vendors },
            vendors
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all customers (role = CUSTOMER)
 */
export async function getCustomers(req, res, next) {
    try {
        const customers = await listUsersWithProfiles(false, 'CUSTOMER');
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Customers retrieved successfully',
            success: true,
            data: { customers },
            customers
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get specific user by ID
 */
export async function getUserById(req, res, next) {
    try {
        const targetId = req.params.id;
        
        // Authorization check: Admin or Self
        if (req.user.role !== 'ADMIN' && req.user.id !== targetId) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You do not have permission to perform this action.',
                success: false,
            });
        }

        const user = await getUserWithProfileById(targetId, true);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'User not found',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User retrieved successfully',
            success: true,
            data: { user },
            user
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update user profile details (Self)
 */
export async function updateProfile(req, res, next) {
    try {
        const userId = req.user.id;
        const { name, email, phone, companyName, gstin, avatar } = req.body;

        const userUpdates = {};
        if (name) userUpdates.name = name.trim();
        if (email) {
            const emailLower = email.trim().toLowerCase();
            if (emailLower !== req.user.email) {
                const existing = await getUserWithProfileByEmail(emailLower);
                if (existing) {
                    return sendResponse({
                        res,
                        statusCode: 400,
                        message: 'Email is already registered',
                        success: false,
                    });
                }
                userUpdates.email = emailLower;
            }
        }

        const profileUpdates = {};
        if (phone !== undefined) profileUpdates.phone = phone ? phone.trim() : null;
        if (companyName !== undefined) profileUpdates.companyName = companyName ? companyName.trim() : null;
        if (gstin !== undefined) profileUpdates.gstin = gstin ? gstin.trim() : null;
        if (avatar !== undefined) profileUpdates.avatar = avatar ? avatar.trim() : null;

        const updatedUser = await db.transaction(async (tx) => {
            return updateUserWithProfile(userId, userUpdates, profileUpdates, tx);
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Profile updated successfully',
            success: true,
            data: { user: updatedUser },
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin update user details (role, isActive)
 */
export async function updateUserAdmin(req, res, next) {
    try {
        const targetId = req.params.id;
        const { role, isActive } = req.body;

        const userUpdates = {};
        if (role) userUpdates.role = role;
        if (isActive !== undefined) userUpdates.isActive = isActive;

        const updatedUser = await db.transaction(async (tx) => {
            return updateUserWithProfile(targetId, userUpdates, {}, tx);
        });

        if (!updatedUser) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'User not found',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User updated successfully',
            success: true,
            data: { user: updatedUser },
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Soft delete a user by ID (Admin only)
 */
export async function deleteUser(req, res, next) {
    try {
        const targetId = req.params.id;
        const deletedUser = await softDeleteUser(targetId);

        if (!deletedUser) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'User not found or already deleted',
                success: false,
            });
        }

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
