import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, pool } from '../config/database.js';
import { users } from './schema/users.schema.js';
import { userProfiles } from './schema/user_profiles.schema.js';

async function seedUsers() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const seedUsersData = [
        {
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'ADMIN',
            emailVerified: true,
            isActive: true,
            isDeleted: false,
        },
        ...Array.from({ length: 10 }, (_, i) => ({
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            password: hashedPassword,
            role: 'USER',
            emailVerified: true,
            isActive: true,
            isDeleted: false,
        })),
    ];

    try {
        const existingUsers = await db.select().from(users).limit(1);
        if (existingUsers.length > 0) {
            console.log('Users table already has records. Skipping user seeding...');
            return;
        }

        const insertedUsers = await db.insert(users).values(seedUsersData).returning();
        console.log(`Seeded ${insertedUsers.length} users successfully`);

        const profiles = insertedUsers.map((user) => ({
            userId: user.id,
            phone: '+919876543210',
            companyName: user.role === 'ADMIN' ? 'Admin Corp' : `User ${user.name} Company`,
            gstin: '22AAAAA0000A1Z5',
            avatar: null,
        }));

        await db.insert(userProfiles).values(profiles);
        console.log('Seeded matching user profiles successfully');
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

async function main() {
    await seedUsers();
    await pool.end();
    process.exit(0);
}

main();