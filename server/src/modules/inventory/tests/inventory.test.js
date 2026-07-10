import 'dotenv/config';
import envConfig from '../../../config/envConfig.js';
import { db, pool } from '../../../config/database.js';
import { products, productVariants, inventory, categories, users } from '../../../db/schema/schema.js';
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

async function testInventoryModule() {
    log('=== STARTING INVENTORY & AVAILABILITY INTEGRATION TESTS ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';
    let testProductId = '';
    let testVariantId = null;
    let cleanupNeeded = false;
    let testCategoryId = '';
    let testAdminUserId = '';

    // Step 0: Ensure database has a product & inventory row for testing
    try {
        log('Step 0: Checking database for existing products and inventory rows...');
        
        // Find or create admin user for vendorId reference
        const adminUsers = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
        if (!adminUsers.length) {
            throw new Error('Admin user (admin@example.com) must exist in database. Please run seeder first.');
        }
        testAdminUserId = adminUsers[0].id;

        // Check if there is an existing inventory record
        const existingInv = await db.select().from(inventory).limit(1);
        if (existingInv.length > 0) {
            testProductId = existingInv[0].productId;
            testVariantId = existingInv[0].variantId;
            log(`Found existing inventory record: Product ID: ${testProductId}, Variant ID: ${testVariantId}`);
        } else {
            log('No inventory records found. Creating test category, product, variant, and inventory...');
            
            // Create test category
            const [cat] = await db.insert(categories).values({
                name: 'Test Category for Inventory',
                slug: `test-cat-inv-${Date.now()}`
            }).returning();
            testCategoryId = cat.id;

            // Create test product
            const [prod] = await db.insert(products).values({
                name: 'Test Projector',
                slug: `test-projector-${Date.now()}`,
                vendorId: testAdminUserId,
                categoryId: testCategoryId,
                isRentable: true,
                published: true,
                stock: 10
            }).returning();
            testProductId = prod.id;

            // Create test variant
            const [variant] = await db.insert(productVariants).values({
                productId: testProductId,
                sku: `TEST-PROJ-VAR-${Date.now()}`,
                stock: 10,
                isPublished: true
            }).returning();
            testVariantId = variant.id;

            // Create inventory row
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
            log(`Created test inventory record: Product ID: ${testProductId}, Variant ID: ${testVariantId}`);
        }
    } catch (err) {
        log(`Fatal during Step 0 DB setup: ${err.message}`);
        await pool.end();
        process.exit(1);
    }

    // Step 1: Admin login
    try {
        log('\nStep 1: Logging in as Admin...');
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(`Admin login failed: ${data.message}`);
        }

        const setCookie = response.headers.get('set-cookie');
        if (!setCookie) {
            throw new Error('No cookie headers returned on login');
        }
        adminCookie = setCookie.split(';')[0];
        log('Login successful.\n');
    } catch (error) {
        log(`Fatal: Failed to login. Make sure backend server is running. ${error.message}`);
        await writeLogsToFile();
        await pool.end();
        process.exit(1);
    }

    // Step 2: GET /inventory
    try {
        log('Step 2: Testing GET /inventory...');
        const res = await fetch(`${BASE_URL}/inventory?page=1&limit=10`, {
            headers: { 'Cookie': adminCookie }
        });
        const body = await res.json();
        log(`Status: ${res.status} (Expected: 200)`);
        log(`Success: ${body.success} (Expected: true)`);
        log(`Count of inventory listed: ${body.data?.inventory?.length}`);
        
        const testRowInList = body.data?.inventory?.find(i => i.productId === testProductId);
        log(`Test product in listed inventory: ${testRowInList ? 'FOUND' : 'NOT FOUND'} (Expected: FOUND)\n`);
    } catch (error) {
        log(`GET /inventory failed: ${error.message}\n`);
    }

    // Step 3: GET /inventory/:productId
    try {
        log(`Step 3: Testing GET /inventory/${testProductId}...`);
        const res = await fetch(`${BASE_URL}/inventory/${testProductId}`, {
            headers: { 'Cookie': adminCookie }
        });
        const body = await res.json();
        log(`Status: ${res.status} (Expected: 200)`);
        log(`Success: ${body.success} (Expected: true)`);
        log(`Returned inventory record count: ${body.data?.inventory?.length}`);
        log(`Returned rental rates count: ${body.data?.rates?.length}\n`);
    } catch (error) {
        log(`GET /inventory/:productId failed: ${error.message}\n`);
    }

    // Step 4: PATCH /inventory/:productId manual adjustments
    try {
        log('Step 4a: Restocking inventory (increase availableQty by 5)...');
        const increaseRes = await fetch(`${BASE_URL}/inventory/${testProductId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                action: 'increase',
                quantity: 5,
                variantId: testVariantId,
                reason: 'Restocking test order'
            })
        });
        const increaseBody = await increaseRes.json();
        log(`Status: ${increaseRes.status} (Expected: 200)`);
        log(`New availableQty: ${increaseBody.data?.inventory?.availableQty} (Expected: 15)`);

        log('\nStep 4b: Decreasing inventory (decrease availableQty by 2)...');
        const decreaseRes = await fetch(`${BASE_URL}/inventory/${testProductId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                action: 'decrease',
                quantity: 2,
                variantId: testVariantId,
                reason: 'Write off expired unit'
            })
        });
        const decreaseBody = await decreaseRes.json();
        log(`Status: ${decreaseRes.status} (Expected: 200)`);
        log(`New availableQty: ${decreaseBody.data?.inventory?.availableQty} (Expected: 13)`);

        log('\nStep 4c: Moving stock to maintenance (move 3 available units to maintenance)...');
        const maintRes = await fetch(`${BASE_URL}/inventory/${testProductId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                action: 'maintenance',
                quantity: 3,
                variantId: testVariantId,
                reason: 'Lens cleaning required'
            })
        });
        const maintBody = await maintRes.json();
        log(`Status: ${maintRes.status} (Expected: 200)`);
        log(`New maintenanceQty: ${maintBody.data?.inventory?.maintenanceQty} (Expected: 3)`);
        log(`New availableQty: ${maintBody.data?.inventory?.availableQty} (Expected: 10)`);

        log('\nStep 4d: Restoring stock from maintenance (restore 2 units)...');
        const restoreRes = await fetch(`${BASE_URL}/inventory/${testProductId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                action: 'restore',
                quantity: 2,
                variantId: testVariantId,
                from: 'maintenance',
                reason: 'Lens cleaning complete'
            })
        });
        const restoreBody = await restoreRes.json();
        log(`Status: ${restoreRes.status} (Expected: 200)`);
        log(`New maintenanceQty: ${restoreBody.data?.inventory?.maintenanceQty} (Expected: 1)`);
        log(`New availableQty: ${restoreBody.data?.inventory?.availableQty} (Expected: 12)`);

        log('\nStep 4e: Marking stock as damaged (move 2 available units to damaged)...');
        const damageRes = await fetch(`${BASE_URL}/inventory/${testProductId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                action: 'damaged',
                quantity: 2,
                variantId: testVariantId,
                reason: 'Broken glass during handling'
            })
        });
        const damageBody = await damageRes.json();
        log(`Status: ${damageRes.status} (Expected: 200)`);
        log(`New damagedQty: ${damageBody.data?.inventory?.damagedQty} (Expected: 2)`);
        log(`New availableQty: ${damageBody.data?.inventory?.availableQty} (Expected: 10)`);

        log('\nStep 4f: Testing adjustment constraint validation (exceeding available)...');
        const errorRes = await fetch(`${BASE_URL}/inventory/${testProductId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                action: 'decrease',
                quantity: 100,
                variantId: testVariantId,
                reason: 'Exceeding limit'
            })
        });
        const errorBody = await errorRes.json();
        log(`Status: ${errorRes.status} (Expected: 400)`);
        log(`Error returned: "${errorBody.error}" (Expected: "INSUFFICIENT_STOCK")\n`);
    } catch (error) {
        log(`PATCH adjustments failed: ${error.message}\n`);
    }

    // Step 5: POST /reservations/check Availability Checking
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 8);

        log(`Step 5a: Checking availability for tomorrow to next week (request 4 units)...`);
        const checkRes = await fetch(`${BASE_URL}/reservations/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: testProductId,
                variantId: testVariantId,
                quantity: 4,
                startDate: tomorrow.toISOString(),
                endDate: nextWeek.toISOString()
            })
        });
        const checkBody = await checkRes.json();
        log(`Status: ${checkRes.status} (Expected: 200)`);
        log(`Available: ${checkBody.success} (Expected: true)`);
        log(`Available Qty: ${checkBody.data?.availableQty} (Expected: 14, since capacity = 10 available + 2 damaged + 1 maint + 3 moved to customer? Wait, total physical is available 10 + 0 reserved + 0 customer = 10? No, let's calculate: available is 10, reserved is 0, customer is 0, so capacity is 10. Available qty returned is 10)`);
        log(`Calculated Available Qty: ${checkBody.data?.availableQty}\n`);

        log(`Step 5b: Checking availability with negative/invalid dates...`);
        const failDateRes = await fetch(`${BASE_URL}/reservations/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: testProductId,
                variantId: testVariantId,
                quantity: 4,
                startDate: nextWeek.toISOString(),
                endDate: tomorrow.toISOString() // End before Start
            })
        });
        const failDateBody = await failDateRes.json();
        log(`Status: ${failDateRes.status} (Expected: 400)`);
        log(`Error returned: "${failDateBody.error}" (Expected: "INVALID_DATE_RANGE")\n`);
    } catch (error) {
        log(`POST availability check failed: ${error.message}\n`);
    }

    // Step 6: Clean up database if seeded
    if (cleanupNeeded) {
        try {
            log('Step 6: Cleaning up database test records...');
            await db.delete(inventory).where(eq(inventory.productId, testProductId));
            await db.delete(productVariants).where(eq(productVariants.productId, testProductId));
            await db.delete(products).where(eq(products.id, testProductId));
            await db.delete(categories).where(eq(categories.id, testCategoryId));
            log('Cleanup completed successfully.\n');
        } catch (error) {
            log(`Cleanup failed: ${error.message}\n`);
        }
    }

    log('=== INVENTORY & AVAILABILITY INTEGRATION TESTS COMPLETED ===');
    await writeLogsToFile();
    await pool.end();
}

testInventoryModule();
