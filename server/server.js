import 'dotenv/config';
import app from './src/app.js';
import { connectToDatabase } from './src/config/database.js';
import envConfig from './src/config/envConfig.js';
import redis from './src/config/cache.js'

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './src/config/database.js';

const PORT = envConfig.SERVER_PORT || 3000;

async function startServer() {
    await connectToDatabase();
    try {
        console.log('Running auto-migrations...');
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('Auto-migrations completed successfully!');
    } catch (migrationError) {
        console.error('Auto-migrations failed:', migrationError);
    }
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer();
