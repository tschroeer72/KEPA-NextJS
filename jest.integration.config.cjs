const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

// Integrationstests: echte MariaDB + echter Next-Server, keine Prisma-Mocks.
// Ausführen mit `npm run test:integration` (siehe integration/global-setup.cjs).
module.exports = createJestConfig({
    testEnvironment: 'node',
    roots: ['<rootDir>/integration'],
    testMatch: ['**/*.int.test.ts'],
    globalSetup: '<rootDir>/integration/global-setup.cjs',
    globalTeardown: '<rootDir>/integration/global-teardown.cjs',
    setupFilesAfterEnv: ['<rootDir>/integration/setup.ts'],
    moduleNameMapper: {
        '^server-only$': '<rootDir>/integration/stubs/server-only.js',
        '^@/(.*)$': '<rootDir>/$1',
    },
    // Alle Tests teilen sich eine DB -> strikt sequentiell
    maxWorkers: 1,
    // Connection-Pools (Prisma/mariadb) halten den Prozess sonst offen
    forceExit: true,
})
