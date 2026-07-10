import request from 'supertest';
import app from '../../../app.js';
import { db, pool } from '../../../config/database.js';
import { users } from '../../../db/schema/users.schema.js';
import { entityDefinitions } from '../schema/crud.schema.js';
import redis from '../../../config/cache.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

describe('CRUD Engine Module Integration Tests', () => {
    let adminCookie;
    let userCookie;
    
    const adminUser = {
        name: 'Admin Tester',
        email: 'admin.tester@example.com',
        password: 'adminpassword123',
        role: 'ADMIN'
    };

    const normalUser = {
        name: 'User Tester',
        email: 'user.tester@example.com',
        password: 'userpassword123',
        role: 'USER'
    };

    const testEntityDefinition = {
        name: 'Test Device',
        slug: 'testdevice',
        description: 'Test entity for integration test checks',
        fields: [
            { name: 'Model Name', columnName: 'model_name', fieldType: 'text', required: true },
            { name: 'Power Rating', columnName: 'power_rating', fieldType: 'number', required: false },
            { name: 'Is Calibrated', columnName: 'is_calibrated', fieldType: 'boolean', required: false, defaultValue: 'false' }
        ]
    };

    beforeEach(async () => {
        const salt = await bcrypt.genSalt(10);
        
        // Clean up previous test users if any
        await db.delete(users).where(eq(users.email, adminUser.email));
        await db.delete(users).where(eq(users.email, normalUser.email));

        // Insert fresh users
        await db.insert(users).values({
            name: adminUser.name,
            email: adminUser.email,
            passwordHash: await bcrypt.hash(adminUser.password, salt),
            role: 'ADMIN',
            emailVerified: true
        });

        await db.insert(users).values({
            name: normalUser.name,
            email: normalUser.email,
            passwordHash: await bcrypt.hash(normalUser.password, salt),
            role: 'USER',
            emailVerified: true
        });

        // Authenticate admin
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: adminUser.email, password: adminUser.password });
        adminCookie = adminLogin.headers['set-cookie'];

        // Authenticate user
        const userLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: normalUser.email, password: normalUser.password });
        userCookie = userLogin.headers['set-cookie'];
    }, 30000);

    afterAll(async () => {
        // Clean up test users
        await db.delete(users).where(eq(users.email, adminUser.email));
        await db.delete(users).where(eq(users.email, normalUser.email));
        
        // Clean up any remaining test tables
        try {
            await pool.query('DROP TABLE IF EXISTS "crud_testdevice" CASCADE;');
            await db.delete(entityDefinitions).where(eq(entityDefinitions.slug, 'testdevice'));
        } catch (e) {
            // Ignore
        }

        // Close connections
        await pool.end();
        await redis.quit();
        await new Promise(resolve => setTimeout(resolve, 50));
    }, 30000);

    describe('RBAC Definitions Management', () => {
        it('should deny non-admin requests to create new entity definitions', async () => {
            const res = await request(app)
                .post('/api/crud/definitions')
                .set('Cookie', userCookie)
                .send(testEntityDefinition);

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should allow admin requests to create new entity definitions and initialize physical database table', async () => {
            const res = await request(app)
                .post('/api/crud/definitions')
                .set('Cookie', adminCookie)
                .send(testEntityDefinition);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.entity.slug).toBe('testdevice');
            expect(res.body.data.entity.fields).toHaveLength(3);
        });

        it('should retrieve registered entity definition list successfully', async () => {
            const res = await request(app)
                .get('/api/crud/definitions')
                .set('Cookie', userCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.entities.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Dynamic Data CRUD Operations', () => {
        let testRecordId;

        it('should insert dynamic record adhering to schema rules successfully', async () => {
            const payload = {
                model_name: 'Superlaser Quantum 9',
                power_rating: 9500,
                is_calibrated: true
            };

            const res = await request(app)
                .post('/api/crud/testdevice')
                .set('Cookie', userCookie)
                .send(payload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.record.id).toBeDefined();
            expect(res.body.data.record.model_name).toBe(payload.model_name);
            expect(Number(res.body.data.record.power_rating)).toBe(payload.power_rating);
            expect(res.body.data.record.is_calibrated).toBe(true);

            testRecordId = res.body.data.record.id;
        });

        it('should fail insertion when required fields are missing', async () => {
            const payload = {
                power_rating: 50
            };

            const res = await request(app)
                .post('/api/crud/testdevice')
                .set('Cookie', userCookie)
                .send(payload);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].field).toBe('model_name');
        });

        it('should query dynamic list matching entity types successfully', async () => {
            const res = await request(app)
                .get('/api/crud/testdevice')
                .set('Cookie', userCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.records).toHaveLength(1);
            expect(res.body.data.pagination.totalRecords).toBe(1);
        });

        it('should update dynamic record values successfully', async () => {
            const payload = {
                power_rating: 12000,
                is_calibrated: false
            };

            const res = await request(app)
                .put(`/api/crud/testdevice/${testRecordId}`)
                .set('Cookie', userCookie)
                .send(payload);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Number(res.body.data.record.power_rating)).toBe(12000);
            expect(res.body.data.record.is_calibrated).toBe(false);
        });

        it('should soft-delete dynamic record successfully', async () => {
            const res = await request(app)
                .delete(`/api/crud/testdevice/${testRecordId}`)
                .set('Cookie', userCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify it does not show up in listings
            const listRes = await request(app)
                .get('/api/crud/testdevice')
                .set('Cookie', userCookie);

            expect(listRes.body.data.records).toHaveLength(0);
        });
    });

    describe('Cleanup Definition & Tables', () => {
        it('should allow admin to delete entity definitions and drop dynamic table', async () => {
            const res = await request(app)
                .delete('/api/crud/definitions/testdevice')
                .set('Cookie', adminCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify table is dropped
            const verifyTableQuery = await pool.query(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crud_testdevice');"
            );
            expect(verifyTableQuery.rows[0].exists).toBe(false);
        });
    });
});
