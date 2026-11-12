const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    coverageProvider: "v8",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    collectCoverageFrom: [
        "app/**/*.{js,jsx,ts,tsx}",
        "components/**/*.{js,jsx,ts,tsx}",
        "lib/**/*.{js,jsx,ts,tsx}",
        "utils/**/*.{js,jsx,ts,tsx}",
        "!**/*.d.ts",
        "!**/node_modules/**",
        "!**/.next/**",
        "!**/coverage/**",
        "!**/jest.config.ts",
    ],
    testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/", "<rootDir>/integration/"],
    transformIgnorePatterns: ["/node_modules/", "^.+\\.module\\.(css|sass|scss)$"],
}

// cookie 2.x ist ESM-only und muss von Jest transformiert werden.
// next/jest setzt transformIgnorePatterns selbst, daher nach dem Erzeugen der Config überschreiben.
module.exports = async () => {
    const config = await createJestConfig(customJestConfig)()
    config.transformIgnorePatterns = [
        "/node_modules/(?!(cookie)/)",
        "^.+[.]module[.](css|sass|scss)$",
    ]
    return config
}
