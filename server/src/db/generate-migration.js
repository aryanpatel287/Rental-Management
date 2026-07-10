import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running drizzle-kit generate...');
const child = exec('npx drizzle-kit generate', { cwd: path.resolve(__dirname, '../../..') });

child.stdout.on('data', (data) => {
    process.stdout.write(data);
});

child.stderr.on('data', (data) => {
    process.stderr.write(data);
});

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code);
});
