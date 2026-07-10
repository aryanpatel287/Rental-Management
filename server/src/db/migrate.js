import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../config/database.js';

async function runMigrations() {
    try {
        console.log('Running migrations...');
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('Migrations completed successfully!');
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
