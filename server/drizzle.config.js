import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import envConfig from './src/config/envConfig';

export default defineConfig({
    schema: './src/db/schema/schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: envConfig.DATABASE_URL,
    },
});
