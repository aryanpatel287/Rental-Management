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

async function testCategoryModule() {
    log('=== STARTING CATEGORY MODULE VERIFICATION ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';

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
        
        // Extract token cookie
        adminCookie = setCookie.split(';')[0];
        log('Login successful. Session Cookie obtained.\n');
    } catch (error) {
        log(`Fatal: Failed to login. Make sure the backend server is running and seeded. ${error.message}`);
        await writeLogsToFile();
        return;
    }

    // 2. Fetch all categories (Public)
    log('Step 2: Testing public GET /api/categories...');
    const getRes = await fetch(`${BASE_URL}/categories`);
    const getData = await getRes.json();
    log(`Status: ${getRes.status}`);
    log(`Success: ${getData.success}`);
    log(`Initial Categories Count: ${getData.data?.categories?.length}\n`);

    // 3. Create category without Auth
    log('Step 3: Testing POST /api/categories (Unauthenticated)...');
    const postUnauthRes = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauth Category' })
    });
    const postUnauthData = await postUnauthRes.json();
    log(`Status: ${postUnauthRes.status} (Expected: 401)`);
    log(`Message: ${postUnauthData.message}\n`);

    // 4. Create Root Category with Auth
    log('Step 4: Creating a root category (Admin authenticated)...');
    const postRootRes = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            name: 'Mechanical Tools',
            description: 'Wrenches, screwdrivers, etc.'
        })
    });
    const postRootData = await postRootRes.json();
    log(`Status: ${postRootRes.status} (Expected: 201)`);
    log(`Created: ${JSON.stringify(postRootData.data?.category)}`);
    const rootId = postRootData.data?.category?.id;
    const rootSlug = postRootData.data?.category?.slug;
    log(`Root Category ID: ${rootId}\n`);

    // 5. Create Child Category with Auth
    log('Step 5: Creating a child category...');
    const postChildRes = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            name: 'Wrenches',
            description: 'Adjustable and socket wrenches',
            parentCategoryId: rootId
        })
    });
    const postChildData = await postChildRes.json();
    log(`Status: ${postChildRes.status} (Expected: 201)`);
    log(`Created: ${JSON.stringify(postChildData.data?.category)}`);
    const childId = postChildData.data?.category?.id;
    log(`Child Category ID: ${childId}\n`);

    // 6. Test circular dependency checks
    log('Step 6a: Attempting to set parent to self (PATCH)...');
    const patchSelfRes = await fetch(`${BASE_URL}/categories/${rootId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({ parentCategoryId: rootId })
    });
    const patchSelfData = await patchSelfRes.json();
    log(`Status: ${patchSelfRes.status} (Expected: 400)`);
    log(`Message: ${patchSelfData.message}\n`);

    log('Step 6b: Attempting circular reference root -> child -> root (PATCH)...');
    const patchCycleRes = await fetch(`${BASE_URL}/categories/${rootId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({ parentCategoryId: childId })
    });
    const patchCycleData = await patchCycleRes.json();
    log(`Status: ${patchCycleRes.status} (Expected: 400)`);
    log(`Message: ${patchCycleData.message}\n`);

    // 7. Check filtering
    log('Step 7a: Filtering root categories (parentCategoryId=null)...');
    const filterRootRes = await fetch(`${BASE_URL}/categories?parentCategoryId=null`);
    const filterRootData = await filterRootRes.json();
    log(`Root categories matching: ${filterRootData.data?.categories?.filter(c => c.id === rootId).length} (Expected: 1)`);

    log('Step 7b: Filtering by slug...');
    const filterSlugRes = await fetch(`${BASE_URL}/categories?slug=${rootSlug}`);
    const filterSlugData = await filterSlugRes.json();
    log(`Slug match count: ${filterSlugData.data?.categories?.length} (Expected: 1)\n`);

    // 8. Delete root category and verify cascade set null
    log('Step 8: Deleting root category...');
    const deleteRes = await fetch(`${BASE_URL}/categories/${rootId}`, {
        method: 'DELETE',
        headers: { 'Cookie': adminCookie }
    });
    const deleteData = await deleteRes.json();
    log(`Status: ${deleteRes.status} (Expected: 200)`);
    log(`Message: ${deleteData.message}\n`);

    // 9. Verify cascade: child category parent should be null
    log('Step 9: Verifying child category parentCategoryId is null...');
    const verifyRes = await fetch(`${BASE_URL}/categories`);
    const verifyData = await verifyRes.json();
    const childCategory = verifyData.data?.categories?.find(c => c.id === childId);
    log(`Child Category name: ${childCategory?.name}`);
    log(`Child Category parentCategoryId: ${childCategory?.parentCategoryId} (Expected: null)`);
    log(`Cascade works: ${childCategory?.parentCategoryId === null ? 'PASS' : 'FAIL'}\n`);

    // 10. Clean up child category
    log('Step 10: Cleaning up child category...');
    const deleteChildRes = await fetch(`${BASE_URL}/categories/${childId}`, {
        method: 'DELETE',
        headers: { 'Cookie': adminCookie }
    });
    const deleteChildData = await deleteChildRes.json();
    log(`Status: ${deleteChildRes.status} (Expected: 200)\n`);

    log('=== CATEGORY MODULE VERIFICATION COMPLETED ===');
    await writeLogsToFile();
}

export { testCategoryModule };
