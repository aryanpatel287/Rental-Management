import { eq } from 'drizzle-orm';
import { db } from '../../../config/database.js';
import { coupons } from '../../../db/schema/schema.js';

/**
 * Validates a coupon and returns the discount amount.
 * @param {string} code Coupon code
 * @param {number} subtotal Cart/Quotation subtotal
 * @param {string} userId Customer user ID
 * @param {object} tx Optional transaction client
 * @returns {Promise<{coupon: object, discount: number}>}
 */
export async function validateCoupon(code, subtotal, userId, tx = db) {
    if (!code) return { coupon: null, discount: 0 };
    
    const normalizedCode = code.trim().toUpperCase();
    const records = await tx.select().from(coupons).where(eq(coupons.code, normalizedCode));
    if (records.length === 0) {
        throw new Error('INVALID_COUPON');
    }

    const coupon = records[0];
    if (!coupon.isActive) {
        throw new Error('INVALID_COUPON');
    }

    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        throw new Error('INVALID_COUPON');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new Error('INVALID_COUPON');
    }

    if (Number(subtotal) < Number(coupon.minimumOrder)) {
        throw new Error('INVALID_COUPON');
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = Number((subtotal * (Number(coupon.discountValue) / 100)).toFixed(2));
    } else {
        discount = Number(Number(coupon.discountValue).toFixed(2));
    }

    // Cap discount at subtotal
    if (discount > subtotal) {
        discount = subtotal;
    }

    return { coupon, discount };
}
