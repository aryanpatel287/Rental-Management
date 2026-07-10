import envConfig from '../../../config/envConfig.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.resolve(__dirname, './variant-test-results.log');

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

async function testVariantModule() {
    log('=== STARTING PRODUCT VARIANTS VERIFICATION ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';
    let categoryId = '';
    let productId = '';
    let variantId = '';

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
        log('Step 2: Creating category...');
        const catRes = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                name: 'Welding Tools',
                description: 'Arc welders and torches'
            })
        });
        const catData = await catRes.json();
        categoryId = catData.data?.category?.id;
        log(`Linked Category ID: ${categoryId}\n`);
    } catch (error) {
        log(`Fatal: Failed to create category: ${error.message}`);
        await writeLogsToFile();
        return;
    }

    // 3. Create Product with Auth
    try {
        log('Step 3: Creating product...');
        const postRes = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookie
            },
            body: JSON.stringify({
                name: 'Professional Arc Welder',
                salePrice: 299.99,
                costPrice: 150.00,
                stock: 3,
                categoryId: categoryId
            })
        });
        const postData = await postRes.json();
        productId = postData.data?.product?.id;
        log(`Created Product ID: ${productId}\n`);
    } catch (error) {
        log(`Fatal: Failed to create product: ${error.message}`);
        await writeLogsToFile();
        return;
    }

    // 4. Create Product Variant
    log('Step 4: Creating a variant...');
    const varRes = await fetch(`${BASE_URL}/products/${productId}/variants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            sku: 'ARC-WELD-220V',
            price: 349.99,
            stock: 2,
            isPublished: true
        })
    });
    const varData = await varRes.json();
    log(`Status: ${varRes.status} (Expected: 201)`);
    log(`Created Variant: ${JSON.stringify(varData.data?.variant)}`);
    variantId = varData.data?.variant?.id;
    log(`Variant ID: ${variantId}\n`);

    // 5. Retrieve product variants (Public)
    log('Step 5: Fetching product variants list...');
    const getRes = await fetch(`${BASE_URL}/products/${productId}/variants`);
    const getData = await getRes.json();
    log(`Status: ${getRes.status} (Expected: 200)`);
    log(`Variants count: ${getData.data?.variants?.length} (Expected: 1)`);
    log(`Variants details: ${JSON.stringify(getData.data?.variants)}\n`);

    // 6. Update Product Variant
    log('Step 6: Updating variant price and stock...');
    const patchRes = await fetch(`${BASE_URL}/variants/${variantId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            price: 329.99,
            stock: 4
        })
    });
    const patchData = await patchRes.json();
    log(`Status: ${patchRes.status} (Expected: 200)`);
    log(`Updated Variant Details: ${JSON.stringify(patchData.data?.variant)}\n`);

    // 7. Delete Variant & Product & Category
    log('Step 7: Deleting variant and cleaning up product/category...');
    const delVar = await fetch(`${BASE_URL}/variants/${variantId}`, {
        method: 'DELETE',
        headers: { 'Cookie': adminCookie }
    });
    log(`Variant DELETE status: ${delVar.status} (Expected: 200)`);

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

    log('=== PRODUCT VARIANTS VERIFICATION COMPLETED ===');
    await writeLogsToFile();
}

export { testVariantModule };
