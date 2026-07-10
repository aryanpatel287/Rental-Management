import envConfig from '../../../config/envConfig.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.resolve(__dirname, './attribute-test-results.log');

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

async function testAttributeModule() {
    log('=== STARTING ATTRIBUTES MODULE VERIFICATION ===');
    log(`Connecting to: ${BASE_URL}\n`);

    let adminCookie = '';
    let attributeId = '';

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

    // 2. Create Attribute with Auth (Voltage)
    log('Step 2: Creating an attribute (Voltage)...');
    const postRes = await fetch(`${BASE_URL}/attributes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            name: 'Voltage'
        })
    });
    const postData = await postRes.json();
    log(`Status: ${postRes.status} (Expected: 201)`);
    log(`Created: ${JSON.stringify(postData.data?.attribute)}`);
    attributeId = postData.data?.attribute?.id;
    log(`Attribute ID: ${attributeId}\n`);

    // 3. Retrieve all attributes (Public)
    log('Step 3: Checking GET /api/attributes list...');
    const getRes = await fetch(`${BASE_URL}/attributes`);
    const getData = await getRes.json();
    const found = getData.data?.attributes?.find(a => a.id === attributeId);
    log(`Found created attribute in public list: ${!!found} (Expected: true)`);
    log(`Attribute Name: ${found?.name} (Expected: Voltage)\n`);

    // 4. Update Attribute Name (Power Source)
    log('Step 4: Updating attribute name...');
    const patchRes = await fetch(`${BASE_URL}/attributes/${attributeId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({
            name: 'Power Source'
        })
    });
    const patchData = await patchRes.json();
    log(`Status: ${patchRes.status} (Expected: 200)`);
    log(`Updated Attribute details: ${JSON.stringify(patchData.data?.attribute)}\n`);

    // 5. Clean up
    log('Step 5: Deleting attribute...');
    const delRes = await fetch(`${BASE_URL}/attributes/${attributeId}`, {
        method: 'DELETE',
        headers: { 'Cookie': adminCookie }
    });
    log(`Attribute DELETE status: ${delRes.status} (Expected: 200)\n`);

    log('=== ATTRIBUTES MODULE VERIFICATION COMPLETED ===');
    await writeLogsToFile();
}

export { testAttributeModule };
