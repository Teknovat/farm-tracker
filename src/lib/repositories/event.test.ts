import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eventRepository, type CreateEventData } from './event'
import { animalRepository, type CreateAnimalData } from './animal'
import { db } from '@/lib/db'
import { users, farms, animals, events } from '@/lib/db/schema'

describe('EventRepository', () => {
    let testUserId: string
    let testFarmId: string
    let testAnimalId: string

    beforeEach(async () => {
        // Clean up tables
        await db.delete(events)
        await db.delete(animals)
        await db.delete(farms)
        await db.delete(users)

        // Create test user
        testUserId = crypto.randomUUID()
        await db.insert(users).values({
            id: testUserId,
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
            passwordHash: 'hash'
        })

        // Create test farm
        testFarmId = crypto.randomUUID()
        await db.insert(farms).values({
            id: testFarmId,
            name: 'Test Farm',
            createdBy: testUserId,
            updatedBy: testUserId
        })

        // Create test animal using the repository
        const animalData: CreateAnimalData = {
            farmId: testFarmId,
            type: 'INDIVIDUAL',
            species: 'Cow',
            sex: 'FEMALE',
            status: 'ACTIVE',
            createdBy: testUserId
        }
        const animal = await animalRepository.create(animalData)
        testAnimalId = animal.id
    })

    afterEach(async () => {
        // Clean up
        await db.delete(events)
        await db.delete(animals)
        await db.delete(farms)
        await db.delete(users)
    })

    describe('create', () => {
        it('should create a new event with required fields', async () => {
            const eventData: CreateEventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL',
                targetId: testAnimalId,
                eventType: 'VACCINATION',
                eventDate: new Date(),
                payload: { vaccine: 'FMD', dose: '5ml' },
                createdBy: testUserId
            }

            const event = await eventRepository.create(eventData)

            expect(event).toBeDefined()
            expect(event.id).toBeDefined()
            expect(event.farmId).toBe(testFarmId)
            expect(event.targetId).toBe(testAnimalId)
            expect(event.eventType).toBe('VACCINATION')
            expect(event.payload).toEqual({ vaccine: 'FMD', dose: '5ml' })
            expect(event.createdBy).toBe(testUserId)
            expect(event.updatedBy).toBe(testUserId)
        })

        it('should create event with optional fields', async () => {
            const nextDueDate = new Date()
            nextDueDate.setDate(nextDueDate.getDate() + 30)

            const eventData: CreateEventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL',
                targetId: testAnimalId,
                eventType: 'TREATMENT',
                eventDate: new Date(),
                payload: { treatment: 'Antibiotic', medication: 'Penicillin' },
                note: 'Follow-up treatment needed',
                cost: 25.50,
                nextDueDate: nextDueDate,
                attachmentUrl: 'https://example.com/receipt.pdf',
                createdBy: testUserId
            }

            const event = await eventRepository.create(eventData)

            expect(event.note).toBe('Follow-up treatment needed')
            expect(event.cost).toBe(25.50)
            // SQLite stores timestamps as seconds, so we need to account for precision loss
            expect(Math.abs((event.nextDueDate?.getTime() || 0) - nextDueDate.getTime())).toBeLessThan(1000)
            expect(event.attachmentUrl).toBe('https://example.com/receipt.pdf')
        })

        it('should validate required fields', async () => {
            const eventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL' as const,
                targetId: testAnimalId,
                eventType: 'VACCINATION' as const,
                // Missing eventDate
                payload: {},
                createdBy: testUserId
            }

            await expect(eventRepository.create(eventData as CreateEventData))
                .rejects.toThrow('Missing required fields')
        })

        it('should validate event type', async () => {
            const eventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL' as const,
                targetId: testAnimalId,
                eventType: 'INVALID_TYPE' as any,
                eventDate: new Date(),
                payload: {},
                createdBy: testUserId
            }

            await expect(eventRepository.create(eventData))
                .rejects.toThrow('Invalid event type: INVALID_TYPE')
        })

        it('should validate target type', async () => {
            const eventData = {
                farmId: testFarmId,
                targetType: 'INVALID_TARGET' as any,
                targetId: testAnimalId,
                eventType: 'VACCINATION' as const,
                eventDate: new Date(),
                payload: {},
                createdBy: testUserId
            }

            await expect(eventRepository.create(eventData))
                .rejects.toThrow('Invalid target type: INVALID_TARGET')
        })
    })

    describe('findByTarget', () => {
        it('should return events for a specific target in chronological order', async () => {
            const baseDate = new Date('2024-01-01')

            // Create events in non-chronological order
            const event2Data: CreateEventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL',
                targetId: testAnimalId,
                eventType: 'WEIGHT',
                eventDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
                payload: { weight: 450, unit: 'kg' },
                createdBy: testUserId
            }

            const event1Data: CreateEventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL',
                targetId: testAnimalId,
                eventType: 'VACCINATION',
                eventDate: baseDate, // earliest
                payload: { vaccine: 'FMD' },
                createdBy: testUserId
            }

            const event3Data: CreateEventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL',
                targetId: testAnimalId,
                eventType: 'NOTE',
                eventDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
                payload: { category: 'health' },
                note: 'Animal looks healthy',
                createdBy: testUserId
            }

            // Create in non-chronological order
            await eventRepository.create(event2Data)
            await eventRepository.create(event1Data)
            await eventRepository.create(event3Data)

            const events = await eventRepository.findByTarget(testFarmId, testAnimalId, 'ANIMAL')

            expect(events).toHaveLength(3)
            expect(events[0].eventType).toBe('VACCINATION') // earliest
            expect(events[1].eventType).toBe('WEIGHT')
            expect(events[2].eventType).toBe('NOTE') // latest
        })
    })

    describe('findWithFilters', () => {
        beforeEach(async () => {
            // Create test events
            const events = [
                {
                    eventType: 'VACCINATION' as const,
                    eventDate: new Date('2024-01-15'),
                    payload: { vaccine: 'FMD' }
                },
                {
                    eventType: 'TREATMENT' as const,
                    eventDate: new Date('2024-01-20'),
                    payload: { treatment: 'Antibiotic' }
                },
                {
                    eventType: 'WEIGHT' as const,
                    eventDate: new Date('2024-01-25'),
                    payload: { weight: 450, unit: 'kg' }
                }
            ]

            for (const eventData of events) {
                await eventRepository.create({
                    farmId: testFarmId,
                    targetType: 'ANIMAL',
                    targetId: testAnimalId,
                    ...eventData,
                    createdBy: testUserId
                })
            }
        })

        it('should filter by event type', async () => {
            const events = await eventRepository.findWithFilters(testFarmId, {
                eventType: 'VACCINATION'
            })

            expect(events).toHaveLength(1)
            expect(events[0].eventType).toBe('VACCINATION')
        })

        it('should filter by multiple event types', async () => {
            const events = await eventRepository.findWithFilters(testFarmId, {
                eventType: ['VACCINATION', 'TREATMENT']
            })

            expect(events).toHaveLength(2)
            expect(events.map(e => e.eventType)).toContain('VACCINATION')
            expect(events.map(e => e.eventType)).toContain('TREATMENT')
        })

        it('should filter by date range', async () => {
            const events = await eventRepository.findWithFilters(testFarmId, {
                startDate: new Date('2024-01-18'),
                endDate: new Date('2024-01-22')
            })

            expect(events).toHaveLength(1)
            expect(events[0].eventType).toBe('TREATMENT')
        })

        it('should apply limit', async () => {
            const events = await eventRepository.findWithFilters(testFarmId, {}, 2)

            expect(events).toHaveLength(2)
        })
    })

    describe('findUpcomingEvents', () => {
        it('should return events with nextDueDate within range', async () => {
            const now = new Date()
            const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 days

            const eventData: CreateEventData = {
                farmId: testFarmId,
                targetType: 'ANIMAL',
                targetId: testAnimalId,
                eventType: 'VACCINATION',
                eventDate: now,
                payload: { vaccine: 'FMD' },
                nextDueDate: futureDate,
                createdBy: testUserId
            }

            await eventRepository.create(eventData)

            const upcomingEvents = await eventRepository.findUpcomingEvents(
                testFarmId,
                new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // +10 days
            )

            expect(upcomingEvents).toHaveLength(1)
            expect(upcomingEvents[0].eventType).toBe('VACCINATION')
        })
    })
})