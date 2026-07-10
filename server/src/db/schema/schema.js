import { users } from './users.schema.js';
import { entityDefinitions, fieldDefinitions } from '../../modules/crud/schema/crud.schema.js';
import { categories } from './categories.schema.js';
import { products } from './products.schema.js';
import { productImages } from './product-images.schema.js';
import { attributes, attributeValues } from './attributes.schema.js';
import { productVariants, variantAttributeValues } from './variants.schema.js';
import { inventory } from './inventory.schema.js';
import { rentalRates } from './rental-rates.schema.js';
import { carts, cartItems } from './carts.schema.js';
import { quotations, quotationItems } from './quotations.schema.js';
import { rentalOrders, rentalOrderItems } from './orders.schema.js';
import { reservations } from './reservations.schema.js';
import { pickups } from './pickups.schema.js';
import { returns } from './returns.schema.js';
import { invoices } from './invoices.schema.js';
import { payments } from './payments.schema.js';
import { coupons, couponUsages } from './coupons.schema.js';
import { notifications } from './notifications.schema.js';
import { settings } from './settings.schema.js';
import { auditLogs } from './audit-logs.schema.js';

export {
    users,
    entityDefinitions,
    fieldDefinitions,
    categories,
    products,
    productImages,
    attributes,
    attributeValues,
    productVariants,
    variantAttributeValues,
    inventory,
    rentalRates,
    carts,
    cartItems,
    quotations,
    quotationItems,
    rentalOrders,
    rentalOrderItems,
    reservations,
    pickups,
    returns,
    invoices,
    payments,
    coupons,
    couponUsages,
    notifications,
    settings,
    auditLogs,
};
