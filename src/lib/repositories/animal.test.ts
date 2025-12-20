import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AnimalRepository, type CreateAnimalData } from './animal'
import { db } from '@/lib/db'
import { animals, farms, users } from '@/lib/db/schema'

describe('AnimalRepository', () => {
    let animalRepository: AnimalRepository
    let testUserId: string
    let testFarmId: string

    beforeEach(async () => {
        animalRepository = new AnimalRepository()

        // Create test user directly with unique email
        testUserId = crypto.randomUUID()
        await db.insert(users).values({
            id: testUserId,
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            name: 'Test User',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        // Create test farm directly
        testFarmId = crypto.randomUUID()
        await db.insert(farms).values({
            id: testFarmId,
            name: 'Test Farm',
            currency: 'TND',
            timezone: 'Africa/Tunis',
            createdBy: testUserId,
            updatedBy: testUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        })
    })

    afterEach(async () => {
        // Clean up test data
        await db.delete(animals)
        await db.delete(farms)
        await db.delete(users)
    })

    describe('create', () => {
        it('should create an individual animal with required fields', async () => {
            const animalData: CreateAnimalData = {
                farmId: testFarmId,
                type: 'INDIVIDUAL',
                species: 'Cattle',
                sex: 'FEMALE',
                status: 'ACTIVE',
                createdBy: testUserId
            }

            const animal = await animalRepository.create(animalData)

            expect(animal).toBeDefined()
            expect(animal.id).toBeDefined()
            expect(animal.farmId).toBe(testFarmId)
            expect(animal.type).toBe('INDIVIDUAL')
            expect(animal.species).toBe('Cattle')
            expect(animal.sex).toBe('FEMALE')
            expect(animal.status).toBe('ACTIVE')
            expect(animal.createdBy).toBe(testUserId)
            expect(animal.createdAt).toBeDefined()
            expect(animal.updatedAt).toBeDefined()
            expect(animal.deletedAt).toBeNull()
        })

        it('should create a lot animal with lot count', async () => {
            const animalData: CreateAnimalData = {
                farmId: testFarmId,
                type: 'LOT',
                species: 'Sheep',
                lotCount: 25,
                status: 'ACTIVE',
                createdBy: testUserId
            }

            const animal = await animalRepository.create(animalData)

            expect(animal).toBeDefined()
            expect(animal.type).toBe('LOT')
            expect(animal.species).toBe('Sheep')
            expect(animal.lotCount).toBe(25)
            expect(animal.sex).toBeNull()
        })

        it('should reject animal creation with missing required fields', async () => {
            const animalData: CreateAnimalData = {
                farmId: testFarmId,
                type: 'INDIVIDUAL',
                species: '', // Empty species
                createdBy: testUserId
            }

            await expect(animalRepository.create(animalData)).rejects.toThrow('Validation failed')
        })

        it('should reject lot animal without lot count', async () => {
            const animalData: CreateAnimalData = {
                farmId: testFarmId,
                type: 'LOT',
                species: 'Goats',
                createdBy: testUserId
            }

            await expect(animalRepository.create(animalData)).rejects.toThrow('Lot animals must have lot count')
        })

        it('should reject individual animal with lot count', async () => {
            const animalData: CreateAnimalData = {
                farmId: testFarmId,
                type: 'INDIVIDUAL',
                species: 'Cattle',
                lotCount: 5,
                createdBy: testUserId
            }

            await expect(animalRepository.create(animalData)).rejects.toThrow('Individual animals cannot have lot count')
        })
    })

    describe('findByFarmId', () => {
        beforeEach(async () => {
            // Create test animals directly
            await db.insert(animals).values({
                id: crypto.randomUUID(),
                farmId: testFarmId,
                type: 'INDIVIDUAL',
                species: 'Cattle',
                sex: 'FEMALE',
                status: 'ACTIVE',
                createdBy: testUserId,
                updatedBy: testUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            })

            await db.insert(animals).values({
                id: crypto.randomUUID(),
                farmId: testFarmId,
                type: 'LOT',
                species: 'Sheep',
                lotCount: 20,
                status: 'ACTIVE',
                createdBy: testUserId,
                updatedBy: testUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            })

            await db.insert(animals).values({
                id: crypto.randomUUID(),
                farmId: testFarmId,
                type: 'INDIVIDUAL',
                species: 'Cattle',
                sex: 'MALE',
                status: 'SOLD',
                createdBy: testUserId,
                updatedBy: testUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            })
        })

        it('should return all animals for a farm', async () => {
            const animals = await animalRepository.findByFarmId(testFarmId)
            expect(animals).toHaveLength(3)
        })

        it('should filter animals by species', async () => {
            const animals = await animalRepository.findByFarmId(testFarmId, { species: 'Cattle' })
            expect(animals).toHaveLength(2)
            expect(animals.every(a => a.species === 'Cattle')).toBe(true)
        })

        it('should filter animals by type', async () => {
            const animals = await animalRepository.findByFarmId(testFarmId, { type: 'LOT' })
            expect(animals).toHaveLength(1)
            expect(animals[0].type).toBe('LOT')
        })

        it('should filter animals by status', async () => {
            const animals = await animalRepository.findByFarmId(testFarmId, { status: 'SOLD' })
            expect(animals).toHaveLength(1)
            expect(animals[0].status).toBe('SOLD')
        })

        it('should filter animals by sex', async () => {
            const animals = await animalRepository.findByFarmId(testFarmId, { sex: 'FEMALE' })
            expect(animals).toHaveLength(1)
            expect(animals[0].sex).toBe('FEMALE')
        })
    })

    describe('update', () => {
        let testAnimalId: string

        beforeEach(async () => {
            testAnimalId = crypto.randomUUID()
            await db.insert(animals).values({
                id: testAnimalId,
                farmId: testFarmId,
                type: 'INDIVIDUAL',
                species: 'Cattle',
                sex: 'FEMALE',
                status: 'ACTIVE',
                createdBy: testUserId,
                updatedBy: testUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            })
        })

        it('should update animal status', async () => {
            const updated = await animalRepository.update(testAnimalId, {
                status: 'SOLD',
                updatedBy: testUserId
            })

            expect(updated).toBeDefined()
            expect(updated!.status).toBe('SOLD')
            expect(updated!.updatedBy).toBe(testUserId)
        })

        it('should reject invalid status', async () => {
            await expect(animalRepository.update(testAnimalId, {
                status: 'INVALID' as any,
                updatedBy: testUserId
            })).rejects.toThrow('Status must be ACTIVE, SOLD, or DEAD')
        })
    })

    describe('softDelete', () => {
        let testAnimalId: string

        beforeEach(async () => {
            testAnimalId = crypto.randomUUID()
            await db.insert(animals).values({
                id: testAnimalId,
                farmId: testFarmId,
                type: 'INDIVIDUAL',
                species: 'Cattle',
                createdBy: testUserId,
                updatedBy: testUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            })
        })

        it('should soft delete an animal', async () => {
            const deleted = await animalRepository.softDelete(testAnimalId)
            expect(deleted).toBe(true)

            const found = await animalRepository.findById(testAnimalId)
            expect(found).toBeNull()
        })
    })
})