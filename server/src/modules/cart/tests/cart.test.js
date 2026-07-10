import 'dotenv/config';
import envConfig from '../../../config/envConfig.js';
import { db, pool } from '../../../config/database.js';
import { products, productVariants, inventory, categories, users, carts, cartItems } from '../../../db/schema/schema.js';
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

async function testCartModule() {
    log('=== STARTING CART INTEGRATION TESTS ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';
    let testProductId = '';
    let testVariantId = null;
    let cleanupNeeded = false;
    let testCategoryId = '';
    let testAdminUserId = '';

    try {
        log('Step 0: Locating admin user and seeding test product...');
        const adminUsers = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
        if (!adminUsers.length) {
            throw new Error('Admin user (admin@example.com) must exist. Run seeder first.');
        }
        testAdminUserId = adminUsers[0].id;

        const [cat] = await db.insert(categories).values({
            name: 'Test Category for Cart',
            slug: `test-cat-cart-${Date.now()}`
        }).returning();
        testCategoryId = cat.id;

        const [prod] = await db.insert(products).values({
            name: 'Test Camera Lens',
            slug: `test-camera-lens-${Date.now()}`,
            vendorId: testAdminUserId,
            categoryId: testCategoryId,
            isRentable: true,
            published: true,
            salePrice: '10000.00',
            costPrice: '8000.00',
            stock: 5
        }).returning();
        testProductId = prod.id;

        const [variant] = await db.insert(productVariants).values({
            productId: testProductId,
            sku: `TEST-LENS-VAR-${Date.now()}`,
            price: '12000.00',
            stock: 5,
            isPublished: true
        }).returning();
        testVariantId = variant.id;

        await db.insert(inventory).values({
            productId: testProductId,
            variantId: testVariantId,
            availableQty: 5,
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
        const loginData = await loginRes.json();
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

        log('\nStep 2: Testing POST /cart/items (Add Item)...');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 2); // 2 days in future
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 6); // 6 days in future (duration = 4 days)

        const addRes = await fetch(`${BASE_URL}/cart/items`, {
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
        const addData = await addRes.json();
        log(`Status: ${addRes.status} (Expected: 200)`);
        log(`Success: ${addData.success} (Expected: true)`);
        log(`Cart Item Count: ${addData.data.items.length} (Expected: 1)`);
        
        const firstItem = addData.data.items[0];
        log(`Calculated Duration: ${firstItem.duration} (Expected: 4)`);
        log(`Item Subtotal: ${firstItem.subtotal} (Expected: 96000 [4 days * 12000 price * 2 quantity])`);
        log(`Item Deposit: ${firstItem.deposit} (Expected: 2400 [10% of 12000 * 2 quantity])`);
        log(`GST: ${addData.data.summary.gst} (Expected: 17280 [18% of 96000])`);
        log(`Grand Total: ${addData.data.summary.grandTotal} (Expected: 115680 [96000 + 17280 + 2400])`);

        log('\nStep 3: Testing duplicate merge logic (Adding same item again)...');
        const mergeRes = await fetch(`${BASE_URL}/cart/items`, {
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
        const mergeData = await mergeRes.json();
        log(`Status: ${mergeRes.status} (Expected: 200)`);
        log(`Cart Item Count: ${mergeData.data.items.length} (Expected: 1 - merged)`);
        log(`Merged Quantity: ${mergeData.data.items[0].quantity} (Expected: 4)`);

        log('\nStep 4: Testing overbooking rejection...');
        const overRes = await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({
                productId: testProductId,
                variantId: testVariantId,
                quantity: 2, // Total would be 4 + 2 = 6, which exceeds stock capacity (5)
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                rentPeriod: 'Day'
            })
        });
        const overData = await overRes.json();
        log(`Status: ${overRes.status} (Expected: 409)`);
        log(`Error Code: ${overData.error} (Expected: INSUFFICIENT_STOCK or RESERVATION_CONFLICT)`);

        log('\nStep 5: Testing PATCH /cart/items/:id (Update Quantity to 3)...');
        const itemId = mergeData.data.items[0].id;
        const patchRes = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({ quantity: 3 })
        });
        const patchData = await patchRes.json();
        log(`Status: ${patchRes.status} (Expected: 200)`);
        log(`New Quantity: ${patchData.data.items[0].quantity} (Expected: 3)`);

        log('\nStep 6: Testing GET /cart (Retrieve Cart)...');
        const getRes = await fetch(`${BASE_URL}/cart`, {
            method: 'GET',
            headers: { Cookie: adminCookie }
        });
        const getData = await getRes.json();
        log(`Status: ${getRes.status} (Expected: 200)`);
        log(`Success: ${getData.success} (Expected: true)`);
        log(`Cart ID matches: ${getData.data.cartId === addData.data.cartId}`);

        log('\nStep 7: Testing DELETE /cart/items/:id...');
        const delRes = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: { Cookie: adminCookie }
        });
        const delData = await delRes.json();
        log(`Status: ${delRes.status} (Expected: 200)`);
        log(`Cart Items Length: ${delData.data.items.length} (Expected: 0)`);

        log('\nStep 8: Testing DELETE /cart/clear...');
        // Add one item back first
        await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({
                productId: testProductId,
                variantId: testVariantId,
                quantity: 1,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            })
        });
        const clearRes = await fetch(`${BASE_URL}/cart/clear`, {
            method: 'DELETE',
            headers: { Cookie: adminCookie }
        });
        const clearData = await clearRes.json();
        log(`Status: ${clearRes.status} (Expected: 200)`);
        log(`Cleared items: ${clearData.data.items.length} (Expected: 0)`);
        log(`Summary: ${clearData.data.summary} (Expected: null)`);

        log('\nStep 9: Testing Date validations...');
        const pastStart = new Date();
        pastStart.setDate(pastStart.getDate() - 2); // 2 days in past
        const pastEnd = new Date();
        pastEnd.setDate(pastEnd.getDate() + 1);

        const invalidRes = await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
            body: JSON.stringify({
                productId: testProductId,
                variantId: testVariantId,
                quantity: 1,
                startDate: pastStart.toISOString().split('T')[0],
                endDate: pastEnd.toISOString().split('T')[0]
            })
        });
        const invalidData = await invalidRes.json();
        log(`Status: ${invalidRes.status} (Expected: 400)`);
        log(`Error: ${invalidData.error} (Expected: INVALID_DATE_RANGE)`);

    } catch (err) {
        log(`TEST RUNNER ERROR: ${err.message}`);
    } finally {
        if (cleanupNeeded) {
            log('\nStep 10: Cleaning up database test records...');
            try {
                // Find and delete the cart item references
                const userCarts = await db.select().from(carts).where(eq(carts.customerId, testAdminUserId));
                for (const c of userCarts) {
                    await db.delete(cartItems).where(eq(cartItems.cartId, c.id));
                    await db.delete(carts).where(eq(carts.id, c.id));
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

    log('\n=== CART INTEGRATION TESTS COMPLETED ===');
    await writeLogsToFile();
    await pool.end();
    process.exit(0);
}

testCartModule();
