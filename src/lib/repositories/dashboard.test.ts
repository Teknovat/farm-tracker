import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fc from 'fast-check'
import { db } from '@/lib/db'
import { animals, events, cashboxMovements, creditExpenses, farms, users, farmMembers } from '@/lib/db/schema'
import { dashboardRepository } from './dashboard'
import { eq } from 'drizzle-orm'

describe('Dashboard Repository Property Tests', () => {
    let testFarmId: string
    let testUserId: string

    beforeAll(async () => {
        // Create unique test identifiers
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)

        // Create test user
        testUserId = `test-user-${timestamp}-${random}`
        await db.insert(users).values({
            id: testUserId,
            email: `test-${timestamp}-${random}@example.com`,
            name: 'Test User',
            passwordHash: 'hash'
        })

        // Create test farm
        testFarmId = `test-farm-${timestamp}-${random}`
        await db.insert(farms).values({
            id: testFarmId,
            name: 'Test Farm',
            createdBy: testUserId,
            updatedBy: testUserId
        })

        // Create farm membership
        await db.insert(farmMembers).values({
            id: `test-member-${timestamp}-${random}`,
            userId: testUserId,
            farmId: testFarmId,
            role: 'OWNER'
        })
    })

    afterAll(async () => {
        // Clean up test data in correct order (foreign key constraints)
        await db.delete(events).where(eq(events.farmId, testFarmId))
        await db.delete(animals).where(eq(animals.farmId, testFarmId))
        await db.delete(cashboxMovements).where(eq(cashboxMovements.farmId, testFarmId))
        await db.delete(creditExpenses).where(eq(creditExpenses.farmId, testFarmId))
        await db.delete(farmMembers).where(eq(farmMembers.farmId, testFarmId))
        await db.delete(farms).where(eq(farms.id, testFarmId))
        await db.delete(users).where(eq(users.id, testUserId))
    })

    /**
     * Feature: farm-management-mvp, Property 18: Dashboard calculation accuracy
     * For any dashboard request, the displayed totals should match the calculated values from the underlying data
     * Validates: Requirements 5.1, 5.2
     */
    it('should calculate dashboard statistics accurately from underlying data', async () => {
        await fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                status: fc.constantFrom('ACTIVE', 'SOLD', 'DEAD'),
                species: fc.string({ minLength: 1, maxLength: 20 })
            }), { minLength: 1, maxLength: 5 }), // Smaller arrays for better performance
            fc.array(fc.record({
                eventType: fc.constantFrom('BIRTH', 'DEATH'),
                eventDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
            }), { minLength: 0, maxLength: 5 }),
            fc.array(fc.record({
                type: fc.constantFrom('DEPOSIT', 'EXPENSE_CASH', 'REIMBURSEMENT'),
                amount: fc.integer({ min: 1, max: 1000 }) // Use integers to avoid floating point issues
            }), { minLength: 0, maxLength: 5 }),
            async (animalData, eventData, movementData) => {
                // Clean up any existing test data first
                await db.delete(events).where(eq(events.farmId, testFarmId))
                await db.delete(animals).where(eq(animals.farmId, testFarmId))
                await db.delete(cashboxMovements).where(eq(cashboxMovements.farmId, testFarmId))
                await db.delete(creditExpenses).where(eq(creditExpenses.farmId, testFarmId))

                // Insert test animals
                const animalIds: string[] = []
                for (let i = 0; i < animalData.length; i++) {
                    const animalId = `test-animal-${Date.now()}-${i}-${Math.random()}`
                    animalIds.push(animalId)
                    await db.insert(animals).values({
                        id: animalId,
                        farmId: testFarmId,
                        type: 'INDIVIDUAL',
                        species: animalData[i].species,
                        status: animalData[i].status,
                        createdBy: testUserId,
                        updatedBy: testUserId
                    })
                }

                // Insert test events
                for (let i = 0; i < eventData.length; i++) {
                    if (animalIds.length > 0) {
                        await db.insert(events).values({
                            id: `test-event-${Date.now()}-${i}-${Math.random()}`,
                            farmId: testFarmId,
                            targetType: 'ANIMAL',
                            targetId: animalIds[i % animalIds.length],
                            eventType: eventData[i].eventType,
                            eventDate: eventData[i].eventDate,
                            payload: {},
                            createdBy: testUserId,
                            updatedBy: testUserId
                        })
                    }
                }

                // Insert test cashbox movements
                for (let i = 0; i < movementData.length; i++) {
                    await db.insert(cashboxMovements).values({
                        id: `test-movement-${Date.now()}-${i}-${Math.random()}`,
                        farmId: testFarmId,
                        type: movementData[i].type,
                        amount: movementData[i].amount,
                        description: `Test movement ${i}`,
                        createdBy: testUserId
                    })
                }

                // Get dashboard stats
                const stats = await dashboardRepository.getDashboardStats(testFarmId)

                // Verify animal counts match inserted data
                const expectedActive = animalData.filter(a => a.status === 'ACTIVE').length
                const expectedSold = animalData.filter(a => a.status === 'SOLD').length
                const expectedDead = animalData.filter(a => a.status === 'DEAD').length

                expect(stats.animals.totalActive).toBe(expectedActive)
                expect(stats.animals.totalSold).toBe(expectedSold)
                expect(stats.animals.totalDead).toBe(expectedDead)

                // Verify cashbox balance calculation
                let expectedBalance = 0
                movementData.forEach(movement => {
                    if (movement.type === 'DEPOSIT') {
                        expectedBalance += movement.amount
                    } else if (movement.type === 'EXPENSE_CASH' || movement.type === 'REIMBURSEMENT') {
                        expectedBalance -= movement.amount
                    }
                })

                expect(stats.financial.cashboxBalance).toBe(expectedBalance)
            }
        ), { numRuns: 20 }) // Reduced runs for faster execution
    })

    /**
     * Feature: farm-management-mvp, Property 19: Reminder date filtering
     * For any reminder request, only events with nextDueDate within the specified timeframe should be returned
     * Validates: Requirements 5.3
     */
    it('should filter reminders correctly by date range', async () => {
        await fc.assert(fc.asyncProperty(
            fc.integer({ min: 1, max: 30 }), // Days ahead
            async (daysAhead) => {
                // Clean up any existing test data first
                await db.delete(events).where(eq(events.farmId, testFarmId))
                await db.delete(animals).where(eq(animals.farmId, testFarmId))

                // Create a test animal first
                const animalId = `test-animal-${Date.now()}-${Math.random()}`
                await db.insert(animals).values({
                    id: animalId,
                    farmId: testFarmId,
                    type: 'INDIVIDUAL',
                    species: 'Test Species',
                    status: 'ACTIVE',
                    createdBy: testUserId,
                    updatedBy: testUserId
                })

                // Calculate date ranges
                const now = new Date()
                const futureDate = new Date()
                futureDate.setDate(now.getDate() + daysAhead)

                const pastDate = new Date()
                pastDate.setDate(now.getDate() - 10)

                const farFutureDate = new Date()
                farFutureDate.setDate(now.getDate() + daysAhead + 10)

                // Insert events: some within range, some outside
                const eventsInRange = 2
                const eventsOutOfRange = 2

                // Events within range
                for (let i = 0; i < eventsInRange; i++) {
                    const dueDate = new Date()
                    dueDate.setDate(now.getDate() + Math.floor(daysAhead / 2)) // Within range

                    await db.insert(events).values({
                        id: `test-event-in-${Date.now()}-${i}-${Math.random()}`,
                        farmId: testFarmId,
                        targetType: 'ANIMAL',
                        targetId: animalId,
                        eventType: 'VACCINATION',
                        eventDate: now,
                        nextDueDate: dueDate,
                        payload: {},
                        createdBy: testUserId,
                        updatedBy: testUserId
                    })
                }

                // Events outside range (past)
                for (let i = 0; i < eventsOutOfRange; i++) {
                    await db.insert(events).values({
                        id: `test-event-past-${Date.now()}-${i}-${Math.random()}`,
                        farmId: testFarmId,
                        targetType: 'ANIMAL',
                        targetId: animalId,
                        eventType: 'TREATMENT',
                        eventDate: now,
                        nextDueDate: pastDate,
                        payload: {},
                        createdBy: testUserId,
                        updatedBy: testUserId
                    })
                }

                // Events outside range (far future)
                for (let i = 0; i < eventsOutOfRange; i++) {
                    await db.insert(events).values({
                        id: `test-event-future-${Date.now()}-${i}-${Math.random()}`,
                        farmId: testFarmId,
                        targetType: 'ANIMAL',
                        targetId: animalId,
                        eventType: 'VACCINATION',
                        eventDate: now,
                        nextDueDate: farFutureDate,
                        payload: {},
                        createdBy: testUserId,
                        updatedBy: testUserId
                    })
                }

                // Get reminders
                const reminders = await dashboardRepository.getReminders(testFarmId, daysAhead)

                // Should only return events within the specified timeframe
                expect(reminders.length).toBe(eventsInRange)

                // Verify all returned reminders are within the specified timeframe
                reminders.forEach(reminder => {
                    expect(reminder.nextDueDate >= now).toBe(true)
                    expect(reminder.nextDueDate <= futureDate).toBe(true)
                })
            }
        ), { numRuns: 20 }) // Reduced runs for faster execution
    })

    /**
     * Feature: farm-management-mvp, Property 21: Financial summary segregation
     * For any financial summary, cash and credit expenses should be displayed in separate totals
     * Validates: Requirements 5.5
     */
    it('should segregate cash and credit expenses correctly', async () => {
        await fc.assert(fc.asyncProperty(
            fc.integer({ min: 1, max: 100 }), // Cash expense amount
            fc.integer({ min: 1, max: 100 }), // Credit expense amount
            async (cashAmount, creditAmount) => {
                // Clean up any existing test data first
                await db.delete(cashboxMovements).where(eq(cashboxMovements.farmId, testFarmId))
                await db.delete(creditExpenses).where(eq(creditExpenses.farmId, testFarmId))

                // Insert one cash expense
                await db.insert(cashboxMovements).values({
                    id: `test-cash-${Date.now()}-${Math.random()}`,
                    farmId: testFarmId,
                    type: 'EXPENSE_CASH',
                    amount: cashAmount,
                    description: 'Test cash expense',
                    category: 'FEED',
                    createdBy: testUserId
                })

                // Insert one credit expense
                await db.insert(creditExpenses).values({
                    id: `test-credit-${Date.now()}-${Math.random()}`,
                    farmId: testFarmId,
                    amount: creditAmount,
                    description: 'Test credit expense',
                    category: 'VET',
                    paidBy: testUserId,
                    remainingAmount: creditAmount,
                    createdBy: testUserId
                })

                // Get dashboard stats
                const stats = await dashboardRepository.getDashboardStats(testFarmId)

                // Verify cash expense affects cashbox balance (negative)
                expect(stats.financial.cashboxBalance).toBe(-cashAmount)

                // Verify credit expense creates outstanding debt
                expect(stats.financial.outstandingDebt).toBe(creditAmount)

                // Verify they are tracked separately
                expect(stats.financial.cashboxBalance).not.toBe(stats.financial.outstandingDebt)
                expect(Math.abs(stats.financial.cashboxBalance)).toBeGreaterThan(0)
                expect(stats.financial.outstandingDebt).toBeGreaterThan(0)
            }
        ), { numRuns: 20 }) // Reduced runs for faster execution
    })
})