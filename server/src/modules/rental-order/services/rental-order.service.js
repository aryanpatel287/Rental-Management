import * as rentalOrderRepo from '../repository/rental-order.repository.js';
import * as quotationRepo from '../../quotation/repository/quotation.repository.js';
import * as reservationRepo from '../../reservation/repository/reservation.repository.js';
import * as inventoryRepo from '../../inventory/repository/inventory.repository.js';
import { checkAvailability } from '../../availability/services/availability.service.js';
import { generateNumber } from '../../number-generator/number-generator.service.js';
import { db } from '../../../config/database.js';
import { rentalOrders, rentalOrderItems, reservations, inventory } from '../../../db/schema/schema.js';
import { eq } from 'drizzle-orm';

export async function confirmQuotation(quotationId, user) {
    return db.transaction(async (tx) => {
        // 1. Fetch & lock quotation
        const qtn = await quotationRepo.findQuotationById(quotationId, tx);
        if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
        if (['Cancelled', 'Confirmed'].includes(qtn.status)) {
            throw new Error('QUOTATION_ALREADY_CONFIRMED');
        }

        // 2. Validate availability for each quotation item
        for (const item of qtn.items) {
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
        }

        // 3. Generate Order Number
        const orderNo = await generateNumber('ORD', rentalOrders, rentalOrders.orderNo, tx);

        // 4. Create Rental Order
        const orderData = {
            orderNo,
            quotationId: qtn.id,
            customerId: qtn.customerId,
            status: 'Confirmed'
        };
        const order = await rentalOrderRepo.create(orderData, tx);

        // 5. Create Order Items, Reservations, and Adjust Inventory Stock
        for (const item of qtn.items) {
            const [ordItem] = await rentalOrderRepo.createItems([{
                orderId: order.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                rentalStart: new Date(item.rentalStart),
                rentalEnd: new Date(item.rentalEnd),
                subtotal: item.subtotal
            }], tx);

            // Create reservation
            await reservationRepo.create({
                orderItemId: ordItem.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                reservedFrom: new Date(item.rentalStart),
                reservedTo: new Date(item.rentalEnd),
                status: 'Reserved'
            }, tx);

            // Update inventory row (decrement available, increment reserved)
            const inv = await inventoryRepo.getInventoryRow(item.productId, item.variantId, tx);
            if (!inv) throw new Error('INVENTORY_NOT_FOUND');
            
            await inventoryRepo.updateInventoryRow(item.productId, item.variantId, {
                availableQty: inv.availableQty - item.quantity,
                reservedQty: inv.reservedQty + item.quantity
            }, tx);
        }

        // 6. Update quotation status
        await quotationRepo.updateQuotation(qtn.id, { status: 'Confirmed' }, tx);

        return rentalOrderRepo.findById(order.id, tx);
    });
}

export async function updateOrderStatus(orderId, nextStatus, user) {
    return db.transaction(async (tx) => {
        const order = await rentalOrderRepo.findById(orderId, tx);
        if (!order) throw new Error('ORDER_NOT_FOUND');

        const current = order.status;
        
        // Enforce state machine transitions
        const validTransitions = {
            'Confirmed': ['PickedUp', 'Cancelled'],
            'PickedUp': ['Active'],
            'Active': ['Returned'],
            'Returned': ['Completed'],
            'Completed': [],
            'Cancelled': []
        };

        if (!validTransitions[current]?.includes(nextStatus)) {
            throw new Error('INVALID_STATUS_TRANSITION');
        }

        // Adjust Inventory per transitions
        if (nextStatus === 'PickedUp') {
            // Move stock from Reserved to WithCustomer
            for (const item of order.items) {
                const inv = await inventoryRepo.getInventoryRow(item.productId, item.variantId, tx);
                await inventoryRepo.updateInventoryRow(item.productId, item.variantId, {
                    reservedQty: inv.reservedQty - item.quantity,
                    withCustomerQty: inv.withCustomerQty + item.quantity
                }, tx);
            }
        } else if (nextStatus === 'Returned') {
            // Move stock from WithCustomer to Available
            for (const item of order.items) {
                const inv = await inventoryRepo.getInventoryRow(item.productId, item.variantId, tx);
                await inventoryRepo.updateInventoryRow(item.productId, item.variantId, {
                    withCustomerQty: inv.withCustomerQty - item.quantity,
                    availableQty: inv.availableQty + item.quantity
                }, tx);
            }
        } else if (nextStatus === 'Completed') {
            // Release reservation logic, set reservations to Completed
            const resList = await rentalOrderRepo.getOrderReservations(orderId, tx);
            for (const res of resList) {
                await reservationRepo.updateStatus(res.id, 'Completed', tx);
            }
        }

        await rentalOrderRepo.update(orderId, { status: nextStatus }, tx);
        return rentalOrderRepo.findById(orderId, tx);
    });
}

export async function cancelOrder(orderId, user) {
    return db.transaction(async (tx) => {
        const order = await rentalOrderRepo.findById(orderId, tx);
        if (!order) throw new Error('ORDER_NOT_FOUND');
        if (order.status !== 'Confirmed') {
            throw new Error('ORDER_ALREADY_COMPLETED'); // Cannot cancel active or completed orders
        }

        // Release reservations & restore inventory stock
        const resList = await rentalOrderRepo.getOrderReservations(orderId, tx);
        for (const res of resList) {
            await reservationRepo.updateStatus(res.id, 'Released', tx);

            const inv = await inventoryRepo.getInventoryRow(res.productId, res.variantId, tx);
            await inventoryRepo.updateInventoryRow(res.productId, res.variantId, {
                reservedQty: inv.reservedQty - res.quantity,
                availableQty: inv.availableQty + res.quantity
            }, tx);
        }

        await rentalOrderRepo.update(orderId, { status: 'Cancelled' }, tx);
        return rentalOrderRepo.findById(orderId, tx);
    });
}
