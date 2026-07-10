import { db } from '../../config/database.js';
import { carts, cartItems } from '../../db/schema/carts.schema.js';
import { products } from '../../db/schema/products.schema.js';
import { productVariants } from '../../db/schema/variants.schema.js';
import { productImages } from '../../db/schema/product-images.schema.js';
import { rentalRates } from '../../db/schema/rental-rates.schema.js';
import { eq, and, or, sql } from 'drizzle-orm';

export async function findOrCreateCart(customerId) {
    const existing = await db.select().from(carts).where(eq(carts.customerId, customerId)).limit(1);
    if (existing.length > 0) return existing[0];
    const [newCart] = await db.insert(carts).values({ customerId }).returning();
    return newCart;
}

export async function getCartWithItems(customerId) {
    const cart = await findOrCreateCart(customerId);
    
    const rows = await db.select({
        itemId: cartItems.id,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        rentPeriod: cartItems.rentPeriod,
        rentalStart: cartItems.rentalStart,
        rentalEnd: cartItems.rentalEnd,
        productName: products.name,
        productIsRentable: products.isRentable,
        productPublished: products.published,
        productSalePrice: products.salePrice,
        productCostPrice: products.costPrice,
        variantSku: productVariants.sku,
        variantPrice: productVariants.price,
        variantIsPublished: productVariants.isPublished,
        ratePrice: rentalRates.price,
        imageUrl: productImages.url
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .leftJoin(productImages, and(eq(cartItems.productId, productImages.productId), eq(productImages.isPrimary, true)))
    .leftJoin(
        rentalRates,
        and(
            eq(rentalRates.productId, cartItems.productId),
            or(
                eq(rentalRates.variantId, cartItems.variantId),
                and(sql`${rentalRates.variantId} IS NULL`, sql`${cartItems.variantId} IS NULL`)
            ),
            eq(rentalRates.period, cartItems.rentPeriod)
        )
    )
    .where(eq(cartItems.cartId, cart.id));

    return { cartId: cart.id, rows };
}

export async function findItemById(itemId) {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, itemId)).limit(1);
    return item || null;
}

export async function createItem(data) {
    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
}

export async function updateItem(itemId, updates) {
    const [item] = await db.update(cartItems)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(cartItems.id, itemId))
        .returning();
    return item;
}

export async function deleteItem(itemId) {
    return db.delete(cartItems).where(eq(cartItems.id, itemId)).returning();
}

export async function clear(cartId) {
    return db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}
