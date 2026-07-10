import 'dotenv/config';
import app from './src/app.js';
import { connectToDatabase } from './src/config/database.js';
import envConfig from './src/config/envConfig.js';
import redis from './src/config/cache.js'

const PORT = envConfig.SERVER_PORT || 3000;

connectToDatabase();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
