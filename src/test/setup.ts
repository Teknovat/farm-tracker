import { beforeAll, afterAll, afterEach } from 'vitest'

// Mock environment variables for testing
beforeAll(() => {
    // Use a unique database for each test run to avoid conflicts
    process.env.DATABASE_URL = `:memory:`
    process.env.JWT_SECRET = 'test-secret-key'
    // NODE_ENV is handled by the test environment
})

// Clean up after each test
afterEach(() => {
    // Reset any global state if needed
})

afterAll(() => {
    // Clean up resources
})