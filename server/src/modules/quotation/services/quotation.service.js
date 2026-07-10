import * as quotationRepo from '../repository/quotation.repository.js';
import * as cartRepo from '../../cart/repository/cart.repository.js';
import * as pricingService from '../../pricing/pricing.service.js';
import * as couponService from '../../coupon/services/coupon.service.js';
import { checkAvailability } from '../../availability/services/availability.service.js';
import { generateNumber } from '../../number-generator/number-generator.service.js';
import { db } from '../../../config/database.js';
import { quotations, products, productVariants } from '../../../db/schema/schema.js';
import { eq } from 'drizzle-orm';

export async function createQuotationFromCart(customerId, couponCode) {
    return db.transaction(async (tx) => {
        const { cartId, rows } = await cartRepo.getCartWithItems(customerId, tx);
        if (rows.length === 0) {
            throw new Error('EMPTY_CART');
        }

        const itemsToInsert = [];
        let subtotalAcc = 0;
        let depositAcc = 0;

        for (const row of rows) {
            // 1. Verify product rentable and published
            if (!row.productIsRentable || !row.productPublished) {
                throw new Error('INSUFFICIENT_STOCK');
            }
            if (row.variantId && !row.variantIsPublished) {
                throw new Error('INSUFFICIENT_STOCK');
            }

            // 2. Validate current stock availability
            const availability = await checkAvailability({
                productId: row.productId,
                variantId: row.variantId,
                quantity: row.quantity,
                startDate: row.rentalStart,
                endDate: row.rentalEnd
            });
            if (!availability.available) {
                throw new Error('INSUFFICIENT_STOCK');
            }

            // 3. Recalculate pricing
            const ratePrice = row.ratePrice || row.variantPrice || row.productSalePrice || 0;
            const price = Number(ratePrice);
            const duration = pricingService.calculateDuration(row.rentalStart, row.rentalEnd, row.rentPeriod);
            const itemSubtotal = pricingService.calculateRental(duration, price, row.quantity);
            const itemDeposit = pricingService.calculateDeposit(
                { salePrice: row.productSalePrice, costPrice: row.productCostPrice },
                row.variantId ? { price: row.variantPrice } : null,
                row.quantity
            );

            subtotalAcc += itemSubtotal;
            depositAcc += itemDeposit;

            itemsToInsert.push({
                productId: row.productId,
                variantId: row.variantId,
                quantity: row.quantity,
                rentalStart: new Date(row.rentalStart),
                rentalEnd: new Date(row.rentalEnd),
                pricePerUnit: String(price),
                subtotal: String(itemSubtotal)
            });
        }

        // 4. Validate coupon
        let discount = 0;
        if (couponCode) {
            const result = await couponService.validateCoupon(couponCode, subtotalAcc, customerId, tx);
            discount = result.discount;
        }

        // 5. Taxes & grand total
        const gst = pricingService.calculateGST(subtotalAcc - discount);
        const grandTotal = Number((subtotalAcc - discount + gst + depositAcc).toFixed(2));

        // 6. Generate Qtn number
        const quotationNo = await generateNumber('QTN', quotations, quotations.quotationNo, tx);

        const qtnData = {
            quotationNo,
            customerId,
            status: 'Draft',
            subtotal: String(subtotalAcc),
            gst: String(gst),
            discount: String(discount),
            securityDeposit: String(depositAcc),
            total: String(grandTotal),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        const newQtn = await quotationRepo.createQuotation(qtnData, itemsToInsert, tx);
        
        // Clear cart
        await cartRepo.clear(cartId, tx);

        return newQtn;
    });
}

export async function updateQuotation(quotationId, items, customerId) {
    return db.transaction(async (tx) => {
        const qtn = await quotationRepo.findQuotationById(quotationId, tx);
        if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
        if (qtn.customerId !== customerId) throw new Error('UNAUTHORIZED');
        if (qtn.status !== 'Draft') throw new Error('QUOTATION_ALREADY_CONFIRMED');

        const itemsToInsert = [];
        let subtotalAcc = 0;
        let depositAcc = 0;

        for (const item of items) {
            const start = new Date(item.rentalStart);
            const end = new Date(item.rentalEnd);
            if (start >= end || start < new Date()) {
                throw new Error('INVALID_DATE_RANGE');
            }

            // Check availability
            const availability = await checkAvailability({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                startDate: item.rentalStart,
                endDate: item.rentalEnd
            });
            if (!availability.available) {
                throw new Error('INSUFFICIENT_STOCK');
            }

            // Load product to retrieve prices
            const [prod] = await tx.select().from(products).where(eq(products.id, item.productId));
            if (!prod || !prod.isRentable) throw new Error('INSUFFICIENT_STOCK');

            let variant = null;
            if (item.variantId) {
                const variants = await tx.select().from(productVariants).where(eq(productVariants.id, item.variantId));
                if (variants.length > 0) variant = variants[0];
            }

            const price = Number(variant?.price || prod.salePrice || 0);
            const duration = pricingService.calculateDuration(item.rentalStart, item.rentalEnd, item.rentPeriod || 'Day');
            const itemSubtotal = pricingService.calculateRental(duration, price, item.quantity);
            const itemDeposit = pricingService.calculateDeposit(prod, variant, item.quantity);

            subtotalAcc += itemSubtotal;
            depositAcc += itemDeposit;

            itemsToInsert.push({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                rentalStart: start,
                rentalEnd: end,
                pricePerUnit: String(price),
                subtotal: String(itemSubtotal)
            });
        }

        let discount = 0;
        const gst = pricingService.calculateGST(subtotalAcc - discount);
        const grandTotal = Number((subtotalAcc - discount + gst + depositAcc).toFixed(2));

        const updates = {
            subtotal: String(subtotalAcc),
            gst: String(gst),
            securityDeposit: String(depositAcc),
            total: String(grandTotal)
        };

        await quotationRepo.updateQuotation(quotationId, updates, tx);
        await quotationRepo.updateQuotationItems(quotationId, itemsToInsert, tx);

        return quotationRepo.findQuotationById(quotationId, tx);
    });
}

export async function deleteQuotation(quotationId, customerId) {
    const qtn = await quotationRepo.findQuotationById(quotationId);
    if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
    if (qtn.customerId !== customerId) throw new Error('UNAUTHORIZED');
    if (qtn.status !== 'Draft') throw new Error('QUOTATION_ALREADY_CONFIRMED');

    return quotationRepo.deleteQuotationAndItems(quotationId);
}

export async function sendQuotation(quotationId, user) {
    const qtn = await quotationRepo.findQuotationById(quotationId);
    if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
    if (qtn.status !== 'Draft') throw new Error('INVALID_STATUS_TRANSITION');
    
    return quotationRepo.updateQuotation(quotationId, { status: 'Sent' });
}

export async function cancelQuotation(quotationId, user) {
    const qtn = await quotationRepo.findQuotationById(quotationId);
    if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
    if (['Cancelled', 'Confirmed'].includes(qtn.status)) {
        throw new Error('INVALID_STATUS_TRANSITION');
    }

    // Check ownership
    if (user.role === 'USER' && qtn.customerId !== user.id) {
        throw new Error('UNAUTHORIZED');
    }

    return quotationRepo.updateQuotation(quotationId, { status: 'Cancelled' });
}
