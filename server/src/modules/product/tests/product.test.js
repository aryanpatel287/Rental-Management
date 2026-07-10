import envConfig from '../../../config/envConfig.js';
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

async function testProductModule() {
    log('=== STARTING PRODUCT MODULE VERIFICATION ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';
    let categoryId = '';
    let productId = '';

    // 1. Login as Admin
    try {
        log('Step 1: Logging in as Admin...');
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(`Admin login failed: ${data.message || response.statusText}`);
        }

        const setCookie = response.headers.get('set-cookie');
        if (!setCookie) {
            throw new Error('No set-cookie header returned on login.');
        }
        
        adminCookie = setCookie.split(';')[0];
        log('Login successful.\n');
    } catch (error) {
        log(`Fatal: Failed to login. Make sure the backend server is running and seeded. ${error.message}`);
        await writeLogsToFile();
        return;
    }

    // 2. Fetch categories to get a valid categoryId
    try {
        log('Step 2: Fetching categories...');
        const catRes = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                name: 'Drilling Equipment',
                description: 'Drills and hammer drills'
            })
        });
        const catData = await catRes.json();
        categoryId = catData.data?.category?.id;
        log(`Linked Category ID: ${categoryId}\n`);
    } catch (error) {
        log(`Fatal: Failed to create/retrieve category: ${error.message}`);
        await writeLogsToFile();
        return;
    }

    // 3. Create Product with Auth
    log('Step 3: Creating a product...');
    const postRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            name: 'Wrench Toolset 100',
            salePrice: 49.99,
            costPrice: 20.00,
            stock: 30,
            categoryId: categoryId
        })
    });
    const postData = await postRes.json();
    log(`Status: ${postRes.status} (Expected: 201)`);
    log(`Created: ${JSON.stringify(postData.data?.product)}`);
    productId = postData.data?.product?.id;
    log(`Product ID: ${productId}\n`);

    // 4. Verify GET /api/products (Public) does not return it yet (since published: false by default)
    log('Step 4: Checking public GET /api/products does not include draft...');
    const getRes = await fetch(`${BASE_URL}/products`);
    const getData = await getRes.json();
    const foundPublic = getData.data?.products?.find(p => p.id === productId);
    log(`Found draft in public list: ${!!foundPublic} (Expected: false)\n`);

    // 5. Publish product
    log('Step 5: Publishing product...');
    const pubRes = await fetch(`${BASE_URL}/products/${productId}/publish`, {
        method: 'PATCH',
        headers: { 'Cookie': adminCookie }
    });
    const pubData = await pubRes.json();
    log(`Status: ${pubRes.status} (Expected: 200)`);
    log(`Message: ${pubData.message}\n`);

    // 6. Verify GET /api/products (Public) now includes the published product
    log('Step 6: Verifying public GET includes published product...');
    const getRes2 = await fetch(`${BASE_URL}/products`);
    const getData2 = await getRes2.json();
    const foundPublic2 = getData2.data?.products?.find(p => p.id === productId);
    log(`Found published in list: ${!!foundPublic2} (Expected: true)`);
    log(`Linked Category details nested: ${JSON.stringify(foundPublic2?.category)}`);
    log(`Linked Vendor details nested: ${JSON.stringify(foundPublic2?.vendor)}\n`);

    // 7. Check availability endpoint
    log('Step 7: Testing product availability GET endpoint...');
    const availRes = await fetch(`${BASE_URL}/products/${productId}/availability`);
    const availData = await availRes.json();
    log(`Status: ${availRes.status} (Expected: 200)`);
    log(`Availability Details: ${JSON.stringify(availData.data)}\n`);

    // 8. Unpublish product
    log('Step 8: Unpublishing product...');
    const unpubRes = await fetch(`${BASE_URL}/products/${productId}/unpublish`, {
        method: 'PATCH',
        headers: { 'Cookie': adminCookie }
    });
    const unpubData = await unpubRes.json();
    log(`Status: ${unpubRes.status} (Expected: 200)`);
    log(`Message: ${unpubData.message}\n`);

    // 9. Clean up Category & Product
    log('Step 9: Cleaning up product and category...');
    const delProduct = await fetch(`${BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Cookie': adminCookie }
    });
    log(`Product DELETE status: ${delProduct.status} (Expected: 200)`);

    const delCat = await fetch(`${BASE_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Cookie': adminCookie }
    });
    log(`Category DELETE status: ${delCat.status} (Expected: 200)\n`);

    log('=== PRODUCT MODULE VERIFICATION COMPLETED ===');
    await writeLogsToFile();
}

export { testProductModule };
