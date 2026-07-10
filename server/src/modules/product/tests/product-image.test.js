import envConfig from '../../../config/envConfig.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.resolve(__dirname, './image-test-results.log');

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

async function testProductImagesModule() {
    log('=== STARTING PRODUCT IMAGES VERIFICATION ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';
    let categoryId = '';
    let productId = '';
    let imageId1 = '';
    let imageId2 = '';

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
                name: 'Carpentry Equipment',
                description: 'Woodworking tools'
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
                name: 'Carpentry Table Saw',
                salePrice: 199.99,
                costPrice: 90.00,
                stock: 5,
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

    // 4. Upload Image 1 (isPrimary: false, but should default to true because it is the first image)
    log('Step 4: Uploading first product image...');
    const imgRes1 = await fetch(`${BASE_URL}/products/${productId}/images`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            url: 'https://example-bucket.s3.amazonaws.com/saw1.jpg',
            isPrimary: false
        })
    });
    const imgData1 = await imgRes1.json();
    log(`Status: ${imgRes1.status} (Expected: 201)`);
    log(`Created: ${JSON.stringify(imgData1.data?.image)}`);
    imageId1 = imgData1.data?.image?.id;
    log(`First Image isPrimary: ${imgData1.data?.image?.isPrimary} (Expected: true)\n`);

    // 5. Upload Image 2 (isPrimary: true, should set Image 1 to isPrimary = false)
    log('Step 5: Uploading second image as primary...');
    const imgRes2 = await fetch(`${BASE_URL}/products/${productId}/images`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            url: 'https://example-bucket.s3.amazonaws.com/saw2.jpg',
            isPrimary: true
        })
    });
    const imgData2 = await imgRes2.json();
    log(`Status: ${imgRes2.status} (Expected: 201)`);
    log(`Created: ${JSON.stringify(imgData2.data?.image)}`);
    imageId2 = imgData2.data?.image?.id;
    log(`Second Image isPrimary: ${imgData2.data?.image?.isPrimary} (Expected: true)\n`);

    // 6. Delete Image 2 (primary image). Image 1 should be promoted to primary
    log('Step 6: Deleting Image 2 (currently primary)...');
    const delRes2 = await fetch(`${BASE_URL}/products/${productId}/images/${imageId2}`, {
        method: 'DELETE',
        headers: { 'Cookie': adminCookie }
    });
    log(`DELETE status: ${delRes2.status} (Expected: 200)\n`);

    // 7. Verify Image 1 is now promoted to primary
    log('Step 7: Verifying Image 1 promotion...');
    const checkRes = await fetch(`${BASE_URL}/products/${productId}`);
    const checkData = await checkRes.json();
    log(`Product details check: ${JSON.stringify(checkData.data?.product)}\n`);

    // 8. Clean up
    log('Step 8: Cleaning up carpentry product and category...');
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

    log('=== PRODUCT IMAGES VERIFICATION COMPLETED ===');
    await writeLogsToFile();
}

export { testProductImagesModule };
