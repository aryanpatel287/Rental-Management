import * as cartRepo from '../repository/cart.repository.js';
import * as pricingService from '../../pricing/pricing.service.js';
import { checkAvailability } from '../../availability/services/availability.service.js';
import { db } from '../../../config/database.js';
import { products, productVariants } from '../../../db/schema/schema.js';
import { eq } from 'drizzle-orm';

export async function getCart(customerId) {
    const { cartId, rows } = await cartRepo.getCartWithItems(customerId);
    if (rows.length === 0) {
        return { cartId, items: [], summary: null };
    }

    const items = [];
    for (const row of rows) {
        const item = {
            id: row.itemId,
            productId: row.productId,
            variantId: row.variantId,
            quantity: row.quantity,
            startDate: row.rentalStart,
            endDate: row.rentalEnd,
            rentPeriod: row.rentPeriod,
            productName: row.productName,
            variantSku: row.variantSku,
            imageUrl: row.imageUrl,
            availabilityWarning: null
        };

        // 1. Validate Product Status & Settings
        if (!row.productIsRentable) {
            item.availabilityWarning = 'PRODUCT_NOT_RENTABLE';
        } else if (!row.productPublished) {
            item.availabilityWarning = 'PRODUCT_UNPUBLISHED';
        } else if (row.variantId && !row.variantIsPublished) {
            item.availabilityWarning = 'VARIANT_UNPUBLISHED';
        } else {
            // 2. Validate current stock availability
            try {
                const availability = await checkAvailability({
                    productId: row.productId,
                    variantId: row.variantId,
                    quantity: row.quantity,
                    startDate: row.rentalStart,
                    endDate: row.rentalEnd
                });
                if (!availability.available) {
                    item.availabilityWarning = availability.reason || 'INSUFFICIENT_STOCK';
                }
            } catch (err) {
                item.availabilityWarning = err.message || 'AVAILABILITY_ERROR';
            }
        }

        // 3. Pricing calculations
        const ratePrice = row.ratePrice || row.variantPrice || row.productSalePrice || 0;
        const price = Number(ratePrice);
        const duration = pricingService.calculateDuration(row.rentalStart, row.rentalEnd, row.rentPeriod);
        const subtotal = pricingService.calculateRental(duration, price, row.quantity);
        const deposit = pricingService.calculateDeposit(
            { salePrice: row.productSalePrice, costPrice: row.productCostPrice },
            row.variantId ? { price: row.variantPrice } : null,
            row.quantity
        );

        item.price = price;
        item.duration = duration;
        item.subtotal = subtotal;
        item.deposit = deposit;

        items.push(item);
    }

    // Calculate cart summary based only on valid items
    const validItems = items.filter(it => !it.availabilityWarning);
    const summary = validItems.length > 0 ? pricingService.calculateCartSummary(validItems) : null;

    return {
        cartId,
        items,
        summary
    };
}

export async function addItem(customerId, { productId, variantId, quantity, startDate, endDate, rentPeriod = 'Day' }) {
    const cart = await cartRepo.findOrCreateCart(customerId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        throw new Error('INVALID_DATE_RANGE');
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (start < todayStart) {
        throw new Error('INVALID_DATE_RANGE');
    }
    if (quantity <= 0) {
        throw new Error('INVALID_QUANTITY');
    }

    // Check product is published & rentable
    const [prod] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!prod) throw new Error('PRODUCT_NOT_FOUND');
    if (!prod.published) throw new Error('PRODUCT_UNPUBLISHED');
    if (!prod.isRentable) throw new Error('PRODUCT_NOT_RENTABLE');

    // Check variant is published if provided
    if (variantId) {
        const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
        if (!variant) throw new Error('VARIANT_NOT_FOUND');
        if (variant.productId !== productId) throw new Error('VARIANT_NOT_FOUND');
        if (!variant.isPublished) throw new Error('VARIANT_UNPUBLISHED');
    }

    // Get current items in cart to see if we can merge
    const { rows } = await cartRepo.getCartWithItems(customerId);
    
    const duplicateRow = rows.find(r => 
        r.productId === productId &&
        r.variantId === variantId &&
        new Date(r.rentalStart).getTime() === start.getTime() &&
        new Date(r.rentalEnd).getTime() === end.getTime() &&
        r.rentPeriod === rentPeriod
    );

    const targetQty = duplicateRow ? duplicateRow.quantity + quantity : quantity;

    // Validate availability for target quantity
    const check = await checkAvailability({ productId, variantId, quantity: targetQty, startDate, endDate });
    if (!check.available) {
        throw new Error(check.reason || 'INSUFFICIENT_STOCK');
    }

    if (duplicateRow) {
        await cartRepo.updateItem(duplicateRow.itemId, { quantity: targetQty });
    } else {
        await cartRepo.createItem({
            cartId: cart.id,
            productId,
            variantId,
            quantity,
            rentPeriod,
            rentalStart: start,
            rentalEnd: end
        });
    }

    return getCart(customerId);
}

export async function updateItem(customerId, itemId, { quantity, variantId, startDate, endDate, rentPeriod }) {
    const item = await cartRepo.findItemById(itemId);
    if (!item) throw new Error('ITEM_NOT_FOUND');

    const { cartId } = await cartRepo.getCartWithItems(customerId);
    if (item.cartId !== cartId) throw new Error('Forbidden');

    const updatedFields = {
        quantity: quantity !== undefined ? quantity : item.quantity,
        variantId: variantId !== undefined ? variantId : item.variantId,
        rentalStart: startDate ? new Date(startDate) : new Date(item.rentalStart),
        rentalEnd: endDate ? new Date(endDate) : new Date(item.rentalEnd),
        rentPeriod: rentPeriod !== undefined ? rentPeriod : item.rentPeriod
    };

    if (updatedFields.quantity <= 0) {
        throw new Error('INVALID_QUANTITY');
    }
    if (updatedFields.rentalStart >= updatedFields.rentalEnd) {
        throw new Error('INVALID_DATE_RANGE');
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (updatedFields.rentalStart < todayStart) {
        throw new Error('INVALID_DATE_RANGE');
    }

    if (updatedFields.variantId) {
        const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, updatedFields.variantId)).limit(1);
        if (!variant) throw new Error('VARIANT_NOT_FOUND');
        if (variant.productId !== item.productId) throw new Error('VARIANT_NOT_FOUND');
        if (!variant.isPublished) throw new Error('VARIANT_UNPUBLISHED');
    }

    // Check stock availability for updated properties
    const check = await checkAvailability({
        productId: item.productId,
        variantId: updatedFields.variantId,
        quantity: updatedFields.quantity,
        startDate: updatedFields.rentalStart.toISOString(),
        endDate: updatedFields.rentalEnd.toISOString()
    });
    if (!check.available) {
        throw new Error(check.reason || 'INSUFFICIENT_STOCK');
    }

    await cartRepo.updateItem(itemId, updatedFields);
    return getCart(customerId);
}

export async function removeItem(customerId, itemId) {
    const item = await cartRepo.findItemById(itemId);
    if (!item) throw new Error('ITEM_NOT_FOUND');

    const { cartId } = await cartRepo.getCartWithItems(customerId);
    if (item.cartId !== cartId) throw new Error('Forbidden');

    await cartRepo.deleteItem(itemId);
    return getCart(customerId);
}

export async function clearCart(customerId) {
    const cart = await cartRepo.findOrCreateCart(customerId);
    await cartRepo.clear(cart.id);
    return { cartId: cart.id, items: [], summary: null };
}
