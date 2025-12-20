import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FarmRepository } from './farm'
import { UserRepository } from './user'
import { db } from '@/lib/db'
import { farms, farmMembers, users, cashboxMovements } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

describe('FarmRepository', () => {
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

    describe('createFarmWithOwner', () => {
        it('should create a farm with owner and initialize cashbox', async () => {
            const farmData = {
                name: 'Test Farm',
                currency: 'USD',
                timezone: 'America/New_York',
                createdBy: testUser.id
            }

            const result = await farmRepo.createFarmWithOwner(farmData)

            expect(result.farm).toBeDefined()
            expect(result.farm.name).toBe('Test Farm')
            expect(result.farm.currency).toBe('USD')
            expect(result.farm.timezone).toBe('America/New_York')
            expect(result.farm.createdBy).toBe(testUser.id)
            expect(result.farm.updatedBy).toBe(testUser.id)

            expect(result.member).toBeDefined()
            expect(result.member.userId).toBe(testUser.id)
            expect(result.member.farmId).toBe(result.farm.id)
            expect(result.member.role).toBe('OWNER')
            expect(result.member.status).toBe('ACTIVE')

            // Verify cashbox was initialized
            const cashboxMovement = await db
                .select()
                .from(cashboxMovements)
                .where(eq(cashboxMovements.farmId, result.farm.id))
                .limit(1)

            expect(cashboxMovement).toHaveLength(1)
            expect(cashboxMovement[0].type).toBe('DEPOSIT')
            expect(cashboxMovement[0].amount).toBe(0)
            expect(cashboxMovement[0].description).toBe('Initial cashbox setup')
        })

        it('should use default values for currency and timezone', async () => {
            const farmData = {
                name: 'Test Farm',
                createdBy: testUser.id
            }

            const result = await farmRepo.createFarmWithOwner(farmData)

            expect(result.farm.currency).toBe('TND')
            expect(result.farm.timezone).toBe('Africa/Tunis')
        })
    })

    describe('findUserFarms', () => {
        it('should return farms where user is a member', async () => {
            const farm1 = await farmRepo.createFarmWithOwner({
                name: 'Farm 1',
                createdBy: testUser.id
            })

            const farm2 = await farmRepo.createFarmWithOwner({
                name: 'Farm 2',
                createdBy: testUser.id
            })

            const userFarms = await farmRepo.findUserFarms(testUser.id)

            expect(userFarms).toHaveLength(2)
            expect(userFarms.map(f => f.name)).toContain('Farm 1')
            expect(userFarms.map(f => f.name)).toContain('Farm 2')
        })

        it('should not return deleted farms', async () => {
            const farm = await farmRepo.createFarmWithOwner({
                name: 'Test Farm',
                createdBy: testUser.id
            })

            await farmRepo.softDelete(farm.farm.id)

            const userFarms = await farmRepo.findUserFarms(testUser.id)
            expect(userFarms).toHaveLength(0)
        })
    })

    describe('inviteMember', () => {
        it('should invite a new member to the farm', async () => {
            const farm = await farmRepo.createFarmWithOwner({
                name: 'Test Farm',
                createdBy: testUser.id
            })

            const newUser = await userRepo.createUser({
                email: 'newuser@example.com',
                name: 'New User',
                passwordHash: 'hashedpassword'
            })

            const member = await farmRepo.inviteMember({
                farmId: farm.farm.id,
                userId: newUser.id,
                role: 'ASSOCIATE',
                invitedBy: testUser.id
            })

            expect(member.userId).toBe(newUser.id)
            expect(member.farmId).toBe(farm.farm.id)
            expect(member.role).toBe('ASSOCIATE')
            expect(member.status).toBe('ACTIVE')
        })

        it('should throw error if user is already a member', async () => {
            const farm = await farmRepo.createFarmWithOwner({
                name: 'Test Farm',
                createdBy: testUser.id
            })

            await expect(farmRepo.inviteMember({
                farmId: farm.farm.id,
                userId: testUser.id,
                role: 'ASSOCIATE',
                invitedBy: testUser.id
            })).rejects.toThrow('User is already a member of this farm')
        })
    })

    describe('updateMemberRole', () => {
        it('should update member role', async () => {
            const farm = await farmRepo.createFarmWithOwner({
                name: 'Test Farm',
                createdBy: testUser.id
            })

            const newUser = await userRepo.createUser({
                email: 'newuser@example.com',
                name: 'New User',
                passwordHash: 'hashedpassword'
            })

            await farmRepo.inviteMember({
                farmId: farm.farm.id,
                userId: newUser.id,
                role: 'WORKER',
                invitedBy: testUser.id
            })

            const updatedMember = await farmRepo.updateMemberRole(
                farm.farm.id,
                newUser.id,
                'ASSOCIATE',
                testUser.id
            )

            expect(updatedMember?.role).toBe('ASSOCIATE')
        })
    })

    describe('soft deletion', () => {
        it('should soft delete farm', async () => {
            const farm = await farmRepo.createFarmWithOwner({
                name: 'Test Farm',
                createdBy: testUser.id
            })

            const deleted = await farmRepo.softDelete(farm.farm.id)
            expect(deleted).toBe(true)

            const foundFarm = await farmRepo.findById(farm.farm.id)
            expect(foundFarm).toBeNull()
        })
    })
})