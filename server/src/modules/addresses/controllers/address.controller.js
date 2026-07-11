import { db } from '../../../config/database.js';
import { 
    createAddress, 
    getAddressById, 
    getAddressesByUserId, 
    updateAddress, 
    deleteAddress,
    unsetDefaultAddresses
} from '../../../dao/address.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * List all addresses of the authenticated user
 */
export async function listAddresses(req, res, next) {
    try {
        const userId = req.user.id;
        const addresses = await getAddressesByUserId(userId);

        // Sort by isDefault DESC and then createdAt DESC
        addresses.sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Addresses retrieved successfully',
            success: true,
            data: { addresses },
            addresses
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create a new address
 */
export async function createAddressHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const { type, address1, address2, city, state, country, zipCode, isDefault } = req.body;
        const isDefaultVal = isDefault === true || isDefault === 'true';

        const address = await db.transaction(async (tx) => {
            if (isDefaultVal) {
                await unsetDefaultAddresses(userId, tx);
            }
            return createAddress(
                {
                    userId,
                    type,
                    address1,
                    address2: address2 || null,
                    city,
                    state,
                    country,
                    zipCode,
                    isDefault: isDefaultVal,
                },
                tx
            );
        });

        return sendResponse({
            res,
            statusCode: 201,
            message: 'Address created successfully',
            success: true,
            data: { address },
            address
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update address details
 */
export async function updateAddressHandler(req, res, next) {
    try {
        const addressId = req.params.id;
        const userId = req.user.id;
        const { type, address1, address2, city, state, country, zipCode, isDefault } = req.body;

        const existingAddress = await getAddressById(addressId);
        if (!existingAddress) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Address not found',
                success: false,
            });
        }

        // Verify ownership (Admin bypasses)
        if (req.user.role !== 'ADMIN' && existingAddress.userId !== userId) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You do not have permission to perform this action.',
                success: false,
            });
        }

        const updates = {};
        if (type) updates.type = type;
        if (address1) updates.address1 = address1;
        if (address2 !== undefined) updates.address2 = address2 || null;
        if (city) updates.city = city;
        if (state) updates.state = state;
        if (country) updates.country = country;
        if (zipCode) updates.zipCode = zipCode;
        if (isDefault !== undefined) updates.isDefault = isDefault === true || isDefault === 'true';

        const targetUserId = existingAddress.userId;

        const updatedAddress = await db.transaction(async (tx) => {
            if (updates.isDefault) {
                await unsetDefaultAddresses(targetUserId, tx);
            }
            return updateAddress(addressId, updates, tx);
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Address updated successfully',
            success: true,
            data: { address: updatedAddress },
            address: updatedAddress
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete address
 */
export async function deleteAddressHandler(req, res, next) {
    try {
        const addressId = req.params.id;
        const userId = req.user.id;

        const existingAddress = await getAddressById(addressId);
        if (!existingAddress) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Address not found',
                success: false,
            });
        }

        // Verify ownership (Admin bypasses)
        if (req.user.role !== 'ADMIN' && existingAddress.userId !== userId) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You do not have permission to perform this action.',
                success: false,
            });
        }

        await deleteAddress(addressId);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Address deleted successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}
