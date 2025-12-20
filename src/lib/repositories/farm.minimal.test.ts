import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FarmRepository } from './farm'
import { UserRepository } from './user'
import { db } from '@/lib/db'
import { farms, farmMembers, users, cashboxMovements } from '@/lib/db/schema'

describe('FarmRepository Minimal', () => {
    let farmRepo: FarmRepository
    let userRepo: UserRepository
    let testUser: any

    beforeEach(async () => {
        farmRepo = new FarmRepository()
        userRepo = new UserRepository()

        // Create a test user with unique email
        testUser = await userRepo.createUser({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            name: 'Test User',
            passwordHash: 'hashedpassword'
        })
    })

    afterEach(async () => {
        // Clean up test data
        await db.delete(cashboxMovements)
        await db.delete(farmMembers)
        await db.delete(farms)
        await db.delete(users)
    })

    it('should create a farm with owner', async () => {
        const farmData = {
            name: 'Test Farm',
            createdBy: testUser.id
        }

        const result = await farmRepo.createFarmWithOwner(farmData)

        expect(result.farm).toBeDefined()
        expect(result.farm.name).toBe('Test Farm')
        expect(result.member).toBeDefined()
        expect(result.member.role).toBe('OWNER')
    })
})