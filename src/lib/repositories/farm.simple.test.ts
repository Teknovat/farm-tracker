import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

describe('Database Connection', () => {
    afterEach(async () => {
        // Clean up test data
        await db.delete(users)
    })

    it('should connect to database and create a user', async () => {
        const email = `test-${Date.now()}-${Math.random()}@example.com`
        const userData = {
            id: crypto.randomUUID(),
            email: email,
            name: 'Test User',
            passwordHash: 'hashedpassword',
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        await db.insert(users).values(userData)

        const result = await db.select().from(users).limit(1)
        expect(result).toHaveLength(1)
        expect(result[0].email).toBe(email)
    })
})