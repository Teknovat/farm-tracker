import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { users, farms } from '@/lib/db/schema'
import { eq, isNull } from 'drizzle-orm'

describe('Debug Database Queries', () => {
    afterEach(async () => {
        await db.delete(farms)
        await db.delete(users)
    })

    it('should work with basic queries', async () => {
        // Create a user
        const userData = {
            id: crypto.randomUUID(),
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            name: 'Test User',
            passwordHash: 'hashedpassword',
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        await db.insert(users).values(userData)

        // Create a farm
        const farmData = {
            id: crypto.randomUUID(),
            name: 'Test Farm',
            currency: 'TND',
            timezone: 'Africa/Tunis',
            createdBy: userData.id,
            updatedBy: userData.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        }

        await db.insert(farms).values(farmData)

        // Test basic select
        const allFarms = await db.select().from(farms)
        expect(allFarms).toHaveLength(1)

        // Test with where clause
        const farmById = await db.select().from(farms).where(eq(farms.id, farmData.id))
        expect(farmById).toHaveLength(1)

        // Test with isNull - this might be the problematic query
        try {
            const activeFarms = await db.select().from(farms).where(isNull(farms.deletedAt))
            expect(activeFarms).toHaveLength(1)
        } catch (error) {
            console.error('Error with isNull query:', error)
            throw error
        }
    })
})