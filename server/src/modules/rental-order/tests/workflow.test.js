import 'dotenv/config';
import envConfig from '../../../config/envConfig.js';
import { db, pool } from '../../../config/database.js';
import { 
    products, 
    productVariants, 
    inventory, 
    categories, 
    users, 
    carts, 
    cartItems, 
    quotations, 
    quotationItems,
    rentalOrders,
    rentalOrderItems,
    reservations
} from '../../../db/schema/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.resolve(__dirname, './test-results.log');

const logLines = [];
function log(msg) {
    console.log(msg);
    logLines.push(msg);
}

async function writeLogsToFile() {
    try {
        fs.writeFileSync(LOG_FILE, logLines.join('\n') + '\n');
    } catch (err) {
        console.error('Failed to write logs to file', err);
    }
}

const PORT = envConfig.SERVER_PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testWorkflowModule() {
    log('=== STARTING QUOTATION & ORDER WORKFLOW INTEGRATION TESTS ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';
    let testProductId = '';
    let testVariantId = null;
    let testCategoryId = '';
    let testAdminUserId = '';
    let cleanupNeeded = false;

    // Track records for cleanup
    let createdQuotationIds = [];
    let createdOrderIds = [];

    try {
        log('Step 0: Locating admin user and seeding test product...');
        const adminUsers = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
        if (!adminUsers.length) {
            throw new Error('Admin user (admin@example.com) must exist. Run seeder first.');
        }
        testAdminUserId = adminUsers[0].id;

        const [cat] = await db.insert(categories).values({
            name: 'Test Category for Workflow',
            slug: `test-cat-wf-${Date.now()}`
        }).returning();
        testCategoryId = cat.id;

        const [prod] = await db.insert(products).values({
            name: 'Test Projector',
            slug: `test-projector-${Date.now()}`,
            vendorId: testAdminUserId,
            categoryId: testCategoryId,
            isRentable: true,
            published: true,
            salePrice: '20000.00',
            costPrice: '15000.00',
            stock: 10
        }).returning();
        testProductId = prod.id;

        const [variant] = await db.insert(productVariants).values({
            productId: testProductId,
            sku: `TEST-PROJ-VAR-${Date.now()}`,
            price: '25000.00',
            stock: 10,
            isPublished: true
        }).returning();
        testVariantId = variant.id;

        await db.insert(inventory).values({
            productId: testProductId,
            variantId: testVariantId,
            availableQty: 10,
            reservedQty: 0,
            withCustomerQty: 0,
            maintenanceQty: 0,
            damagedQty: 0
        });

        cleanupNeeded = true;
        log(`Created test inventory: Product ID ${testProductId}, Variant ID ${testVariantId}`);

        log('\nStep 1: Logging in as Admin...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });
        if (!loginRes.ok) throw new Error('Login failed');
        const rawCookie = loginRes.headers.get('set-cookie');
        if (rawCookie) {
            adminCookie = rawCookie.split(';')[0];
        }
        log('Login successful.');

        // Clear cart first to start fresh
        await fetch(`${BASE_URL}/cart/clear`, {
            method: 'DELETE',
            headers: { Cookie: adminCookie }
        });

        log('\nStep 2: Adding items to cart...');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 3); // 3 days in future
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 5); // 5 days in future (duration = 2 days)

        await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({
                productId: testProductId,
                variantId: testVariantId,
                quantity: 2,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                rentPeriod: 'Day'
            })
        });

        log('\nStep 3: Creating Quotation from Cart (POST /quotations)...');
        const qtnRes = await fetch(`${BASE_URL}/quotations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({})
        });
        const qtnData = await qtnRes.json();
        log(`Status: ${qtnRes.status} (Expected: 201)`);
        log(`Success: ${qtnData.success} (Expected: true)`);
        
        const qtn = qtnData.data.quotation;
        createdQuotationIds.push(qtn.id);
        log(`Quotation Number: ${qtn.quotationNo} (Expected format QTN-YYYYMMDD-XXXXX)`);
        log(`Quotation Status: ${qtn.status} (Expected: Draft)`);
        log(`Quotation Subtotal: ${qtn.subtotal} (Expected: 100000 [2 days * 25000 price * 2 quantity])`);
        log(`Quotation Security Deposit: ${qtn.securityDeposit} (Expected: 5000 [10% of 25000 * 2 quantity])`);
        log(`Quotation GST: ${qtn.gst} (Expected: 18000 [18% of 100000])`);
        log(`Quotation Total: ${qtn.total} (Expected: 123000 [100000 subtotal + 18000 GST + 5000 Deposit])`);

        log('\nStep 4: Checking Cart is now empty...');
        const cartRes = await fetch(`${BASE_URL}/cart`, {
            method: 'GET',
            headers: { Cookie: adminCookie }
        });
        const cartData = await cartRes.json();
        log(`Cart items length: ${cartData.data.items.length} (Expected: 0)`);

        log('\nStep 5: Testing GET /quotations (Retrieving list)...');
        const getQtnsRes = await fetch(`${BASE_URL}/quotations`, {
            method: 'GET',
            headers: { Cookie: adminCookie }
        });
        const getQtnsData = await getQtnsRes.json();
        log(`Status: ${getQtnsRes.status} (Expected: 200)`);
        log(`Quotations list length: ${getQtnsData.data.quotations.length} (Expected >= 1)`);

        log('\nStep 6: Testing GET /quotations/:id...');
        const qtnDetailRes = await fetch(`${BASE_URL}/quotations/${qtn.id}`, {
            method: 'GET',
            headers: { Cookie: adminCookie }
        });
        const qtnDetailData = await qtnDetailRes.json();
        log(`Status: ${qtnDetailRes.status} (Expected: 200)`);
        log(`Detail items count: ${qtnDetailData.data.quotation.items.length} (Expected: 1)`);

        log('\nStep 7: Testing Quotation send flow (POST /quotations/:id/send)...');
        const sendRes = await fetch(`${BASE_URL}/quotations/${qtn.id}/send`, {
            method: 'POST',
            headers: { Cookie: adminCookie }
        });
        const sendData = await sendRes.json();
        log(`Status: ${sendRes.status} (Expected: 200)`);
        log(`Updated Status: ${sendData.data.quotation.status} (Expected: Sent)`);

        log('\nStep 8: Confirming Quotation -> Order Conversion (POST /quotations/:id/confirm)...');
        const confirmRes = await fetch(`${BASE_URL}/quotations/${qtn.id}/confirm`, {
            method: 'POST',
            headers: { Cookie: adminCookie }
        });
        const confirmData = await confirmRes.json();
        log(`Status: ${confirmRes.status} (Expected: 201)`);
        log(`Success: ${confirmData.success} (Expected: true)`);
        
        const order = confirmData.data.order;
        createdOrderIds.push(order.id);
        log(`Created Order Number: ${order.orderNo} (Expected format ORD-YYYYMMDD-XXXXX)`);
        log(`Order Status: ${order.status} (Expected: Confirmed)`);
        log(`Order Items Count: ${order.items.length} (Expected: 1)`);

        log('\nStep 9: Checking Inventory adjustments after confirmation...');
        // Should decrement available, increment reserved
        const [invAfterConfirm] = await db.select().from(inventory).where(eq(inventory.productId, testProductId));
        log(`Available Qty: ${invAfterConfirm.availableQty} (Expected: 8)`);
        log(`Reserved Qty: ${invAfterConfirm.reservedQty} (Expected: 2)`);

        log('\nStep 10: Checking Reservation record is active...');
        const activeResList = await db.select().from(reservations).where(eq(reservations.productId, testProductId));
        log(`Reservations count: ${activeResList.length} (Expected: 1)`);
        log(`Reservation Status: ${activeResList[0].status} (Expected: Reserved)`);

        log('\nStep 11: Testing Order Pickup status transition...');
        const pickupRes = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({ status: 'PickedUp' })
        });
        const pickupData = await pickupRes.json();
        log(`Status: ${pickupRes.status} (Expected: 200)`);
        log(`Updated Status: ${pickupData.data.order.status} (Expected: PickedUp)`);

        // Check stock movement: reserved -> withCustomer
        const [invAfterPickup] = await db.select().from(inventory).where(eq(inventory.productId, testProductId));
        log(`Reserved Qty: ${invAfterPickup.reservedQty} (Expected: 0)`);
        log(`WithCustomer Qty: ${invAfterPickup.withCustomerQty} (Expected: 2)`);

        log('\nStep 12: Testing Order Active status transition...');
        const activeRes = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({ status: 'Active' })
        });
        const activeData = await activeRes.json();
        log(`Status: ${activeRes.status} (Expected: 200)`);
        log(`Updated Status: ${activeData.data.order.status} (Expected: Active)`);

        log('\nStep 13: Testing Order Return status transition...');
        const returnRes = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({ status: 'Returned' })
        });
        const returnData = await returnRes.json();
        log(`Status: ${returnRes.status} (Expected: 200)`);
        log(`Updated Status: ${returnData.data.order.status} (Expected: Returned)`);

        // Check stock movement: withCustomer -> available
        const [invAfterReturn] = await db.select().from(inventory).where(eq(inventory.productId, testProductId));
        log(`WithCustomer Qty: ${invAfterReturn.withCustomerQty} (Expected: 0)`);
        log(`Available Qty: ${invAfterReturn.availableQty} (Expected: 10)`);

        log('\nStep 14: Testing Order Complete status transition...');
        const completeRes = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({ status: 'Completed' })
        });
        const completeData = await completeRes.json();
        log(`Status: ${completeRes.status} (Expected: 200)`);
        log(`Updated Status: ${completeData.data.order.status} (Expected: Completed)`);

        // Reservation should now be Completed
        const [resAfterComplete] = await db.select().from(reservations).where(eq(reservations.productId, testProductId));
        log(`Reservation Status: ${resAfterComplete.status} (Expected: Completed)`);

        log('\nStep 15: Testing Order Cancellation & Stock Release flow...');
        // Create second quotation and confirm it
        await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({
                productId: testProductId,
                variantId: testVariantId,
                quantity: 1,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                rentPeriod: 'Day'
            })
        });
        const qtn2Res = await fetch(`${BASE_URL}/quotations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({})
        });
        const qtn2Data = await qtn2Res.json();
        const qtn2 = qtn2Data.data.quotation;
        createdQuotationIds.push(qtn2.id);

        const confirm2Res = await fetch(`${BASE_URL}/quotations/${qtn2.id}/confirm`, {
            method: 'POST',
            headers: { Cookie: adminCookie }
        });
        const confirm2Data = await confirm2Res.json();
        const order2 = confirm2Data.data.order;
        createdOrderIds.push(order2.id);

        // Cancel the order
        const cancelRes = await fetch(`${BASE_URL}/orders/${order2.id}/cancel`, {
            method: 'POST',
            headers: { Cookie: adminCookie }
        });
        const cancelData = await cancelRes.json();
        log(`Cancel Status: ${cancelRes.status} (Expected: 200)`);
        log(`Order 2 Status: ${cancelData.data.order.status} (Expected: Cancelled)`);

        // Check stock is restored
        const [invAfterCancel] = await db.select().from(inventory).where(eq(inventory.productId, testProductId));
        log(`Available Qty after cancel: ${invAfterCancel.availableQty} (Expected: 10)`);
        log(`Reserved Qty after cancel: ${invAfterCancel.reservedQty} (Expected: 0)`);

    } catch (err) {
        log(`TEST RUNNER ERROR: ${err.message}`);
    } finally {
        if (cleanupNeeded) {
            log('\nStep 16: Cleaning up database test records...');
            try {
                // Delete reservations, order items, orders, quotation items, quotations, inventory, etc.
                for (const orderId of createdOrderIds) {
                    const oItems = await db.select().from(rentalOrderItems).where(eq(rentalOrderItems.orderId, orderId));
                    for (const oit of oItems) {
                        await db.delete(reservations).where(eq(reservations.orderItemId, oit.id));
                    }
                    await db.delete(rentalOrderItems).where(eq(rentalOrderItems.orderId, orderId));
                    await db.delete(rentalOrders).where(eq(rentalOrders.id, orderId));
                }
                for (const qtnId of createdQuotationIds) {
                    await db.delete(quotationItems).where(eq(quotationItems.quotationId, qtnId));
                    await db.delete(quotations).where(eq(quotations.id, qtnId));
                }
                await db.delete(inventory).where(eq(inventory.productId, testProductId));
                await db.delete(productVariants).where(eq(productVariants.productId, testProductId));
                await db.delete(products).where(eq(products.id, testProductId));
                await db.delete(categories).where(eq(categories.id, testCategoryId));
                log('Cleanup completed successfully.');
            } catch (cleanErr) {
                log(`Failed to cleanup database: ${cleanErr.message}`);
            }
        }
    }

    log('\n=== QUOTATION & ORDER WORKFLOW INTEGRATION TESTS COMPLETED ===');
    await writeLogsToFile();
    await pool.end();
    process.exit(0);
}

testWorkflowModule();
