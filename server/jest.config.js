export default {
    testEnvironment: 'node',
    transform: {},
    roots: ['<rootDir>/src'],
    testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
    setupFiles: ['<rootDir>/src/modules/auth/tests/dotenv-setup.js'],
    setupFilesAfterEnv: ['<rootDir>/src/modules/auth/tests/setup.js'],
};
