import { describe, it, expect } from 'vitest'
import {
    validateRequestBody,
    validateQueryParams,
    depositSchema,
    cashExpenseSchema,
    creditExpenseSchema,
    reimbursementSchema,
    animalCreateSchema,
    animalUpdateSchema,
    eventCreateSchema,
    eventUpdateSchema,
    farmCreateSchema,
    farmUpdateSchema,
    memberInviteSchema,
    memberUpdateSchema,
    animalFiltersSchema,
    eventFiltersSchema,
    cashboxFiltersSchema
} from './validation'

describe('Validation Schemas', () => {
    describe('depositSchema', () => {
        it('should validate valid deposit data', () => {
            const validData = {
                amount: 100.50,
                description: 'Test deposit'
            }

            const result = validateRequestBody(depositSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual(validData)
        })

        it('should reject negative amounts', () => {
            const invalidData = {
                amount: -50,
                description: 'Test deposit'
            }

            const result = validateRequestBody(depositSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'amount',
                    message: 'Amount must be positive'
                })
            )
        })

        it('should reject empty description', () => {
            const invalidData = {
                amount: 100,
                description: ''
            }

            const result = validateRequestBody(depositSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'description',
                    message: 'Description cannot be empty'
                })
            )
        })

        it('should reject amounts exceeding maximum', () => {
            const invalidData = {
                amount: 2000000,
                description: 'Large deposit'
            }

            const result = validateRequestBody(depositSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'amount',
                    message: 'Amount cannot exceed 1,000,000'
                })
            )
        })
    })

    describe('cashExpenseSchema', () => {
        it('should validate valid expense data', () => {
            const validData = {
                amount: 75.25,
                description: 'Feed purchase',
                category: 'FEED'
            }

            const result = validateRequestBody(cashExpenseSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual(validData)
        })

        it('should reject invalid category', () => {
            const invalidData = {
                amount: 100,
                description: 'Test expense',
                category: 'INVALID_CATEGORY'
            }

            const result = validateRequestBody(cashExpenseSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'category',
                    message: expect.stringContaining('Invalid')
                })
            )
        })
    })

    describe('animalCreateSchema', () => {
        it('should validate individual animal data', () => {
            const validData = {
                type: 'INDIVIDUAL',
                species: 'Cow',
                sex: 'FEMALE',
                birthDate: '2023-01-15T00:00:00.000Z',
                status: 'ACTIVE'
            }

            const result = validateRequestBody(animalCreateSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual(expect.objectContaining(validData))
        })

        it('should validate lot animal data', () => {
            const validData = {
                type: 'LOT',
                species: 'Chicken',
                lotCount: 50,
                status: 'ACTIVE'
            }

            const result = validateRequestBody(animalCreateSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual(expect.objectContaining(validData))
        })

        it('should reject LOT without lotCount', () => {
            const invalidData = {
                type: 'LOT',
                species: 'Chicken',
                status: 'ACTIVE'
            }

            const result = validateRequestBody(animalCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'lotCount',
                    message: expect.stringContaining('required for LOT type')
                })
            )
        })

        it('should reject INDIVIDUAL with lotCount', () => {
            const invalidData = {
                type: 'INDIVIDUAL',
                species: 'Cow',
                lotCount: 1,
                status: 'ACTIVE'
            }

            const result = validateRequestBody(animalCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'lotCount',
                    message: expect.stringContaining('should not be provided for INDIVIDUAL')
                })
            )
        })

        it('should reject invalid animal type', () => {
            const invalidData = {
                type: 'INVALID_TYPE',
                species: 'Cow',
                status: 'ACTIVE'
            }

            const result = validateRequestBody(animalCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'type',
                    message: expect.stringContaining('INDIVIDUAL or LOT')
                })
            )
        })

        it('should reject negative estimated age', () => {
            const invalidData = {
                type: 'INDIVIDUAL',
                species: 'Cow',
                estimatedAge: -1,
                status: 'ACTIVE'
            }

            const result = validateRequestBody(animalCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'estimatedAge',
                    message: 'Age cannot be negative'
                })
            )
        })
    })

    describe('eventCreateSchema', () => {
        it('should validate valid event data', () => {
            const validData = {
                targetId: '123e4567-e89b-12d3-a456-426614174000',
                targetType: 'ANIMAL',
                eventType: 'VACCINATION',
                eventDate: '2023-12-01T10:00:00.000Z',
                note: 'Annual vaccination',
                cost: 25.50
            }

            const result = validateRequestBody(eventCreateSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual(expect.objectContaining(validData))
        })

        it('should require cost for SALE events', () => {
            const invalidData = {
                targetId: '123e4567-e89b-12d3-a456-426614174000',
                targetType: 'ANIMAL',
                eventType: 'SALE',
                eventDate: '2023-12-01T10:00:00.000Z'
            }

            const result = validateRequestBody(eventCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    message: 'Sale events must have a positive cost value'
                })
            )
        })

        it('should reject invalid UUID for targetId', () => {
            const invalidData = {
                targetId: 'invalid-uuid',
                targetType: 'ANIMAL',
                eventType: 'NOTE',
                eventDate: '2023-12-01T10:00:00.000Z'
            }

            const result = validateRequestBody(eventCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'targetId',
                    message: 'Invalid target ID format'
                })
            )
        })

        it('should reject invalid event type', () => {
            const invalidData = {
                targetId: '123e4567-e89b-12d3-a456-426614174000',
                targetType: 'ANIMAL',
                eventType: 'INVALID_EVENT',
                eventDate: '2023-12-01T10:00:00.000Z'
            }

            const result = validateRequestBody(eventCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'eventType',
                    message: 'Invalid event type'
                })
            )
        })

        it('should reject negative cost', () => {
            const invalidData = {
                targetId: '123e4567-e89b-12d3-a456-426614174000',
                targetType: 'ANIMAL',
                eventType: 'TREATMENT',
                eventDate: '2023-12-01T10:00:00.000Z',
                cost: -10
            }

            const result = validateRequestBody(eventCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'cost',
                    message: 'Cost cannot be negative'
                })
            )
        })
    })

    describe('farmCreateSchema', () => {
        it('should validate valid farm data', () => {
            const validData = {
                name: 'My Farm',
                currency: 'USD',
                timezone: 'America/New_York'
            }

            const result = validateRequestBody(farmCreateSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual(validData)
        })

        it('should use default values', () => {
            const validData = {
                name: 'My Farm'
            }

            const result = validateRequestBody(farmCreateSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({
                name: 'My Farm',
                currency: 'TND',
                timezone: 'Africa/Tunis'
            })
        })

        it('should reject invalid currency length', () => {
            const invalidData = {
                name: 'My Farm',
                currency: 'INVALID'
            }

            const result = validateRequestBody(farmCreateSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'currency',
                    message: 'Currency must be exactly 3 characters (e.g., TND, USD)'
                })
            )
        })
    })

    describe('memberInviteSchema', () => {
        it('should validate valid member invite data', () => {
            const validData = {
                email: 'test@example.com',
                role: 'ASSOCIATE'
            }

            const result = validateRequestBody(memberInviteSchema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({
                email: 'test@example.com', // Should be lowercased
                role: 'ASSOCIATE'
            })
        })

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'invalid-email',
                role: 'WORKER'
            }

            const result = validateRequestBody(memberInviteSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'email',
                    message: 'Invalid email address format'
                })
            )
        })

        it('should reject invalid role', () => {
            const invalidData = {
                email: 'test@example.com',
                role: 'INVALID_ROLE'
            }

            const result = validateRequestBody(memberInviteSchema, invalidData)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'role',
                    message: 'Invalid role selected'
                })
            )
        })
    })

    describe('Query Parameter Validation', () => {
        it('should validate animal filters', () => {
            const searchParams = new URLSearchParams()
            searchParams.set('species', 'Cow')
            searchParams.set('type', 'INDIVIDUAL')
            searchParams.set('status', 'ACTIVE')
            searchParams.set('limit', '25')

            const result = validateQueryParams(animalFiltersSchema, searchParams)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({
                species: 'Cow',
                type: 'INDIVIDUAL',
                status: 'ACTIVE',
                limit: 25
            })
        })

        it('should validate event filters with date range', () => {
            const searchParams = new URLSearchParams()
            searchParams.set('eventType', 'VACCINATION')
            searchParams.set('startDate', '2023-01-01T00:00:00.000Z')
            searchParams.set('endDate', '2023-12-31T23:59:59.999Z')

            const result = validateQueryParams(eventFiltersSchema, searchParams)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({
                eventType: 'VACCINATION',
                startDate: '2023-01-01T00:00:00.000Z',
                endDate: '2023-12-31T23:59:59.999Z'
            })
        })

        it('should handle boolean parameters', () => {
            const searchParams = new URLSearchParams()
            searchParams.set('hasNextDueDate', 'true')

            const result = validateQueryParams(eventFiltersSchema, searchParams)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({
                hasNextDueDate: true
            })
        })

        it('should reject invalid limit values', () => {
            const searchParams = new URLSearchParams()
            searchParams.set('limit', '200') // Exceeds max of 100

            const result = validateQueryParams(animalFiltersSchema, searchParams)

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'limit'
                })
            )
        })
    })

    describe('Edge Cases', () => {
        it('should handle missing required fields', () => {
            const result = validateRequestBody(animalCreateSchema, {})

            expect(result.success).toBe(false)
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'type',
                    message: 'Animal type is required'
                })
            )
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'species',
                    message: 'Species is required'
                })
            )
        })

        it('should trim whitespace from strings', () => {
            const dataWithWhitespace = {
                amount: 100,
                description: '  Test deposit  '
            }

            const result = validateRequestBody(depositSchema, dataWithWhitespace)

            expect(result.success).toBe(true)
            expect(result.data?.description).toBe('Test deposit')
        })

        it('should handle null and undefined values', () => {
            const dataWithNulls = {
                type: 'INDIVIDUAL',
                species: 'Cow',
                sex: null,
                birthDate: undefined
            }

            const result = validateRequestBody(animalCreateSchema, dataWithNulls)

            expect(result.success).toBe(true)
            expect(result.data?.sex).toBeUndefined()
            expect(result.data?.birthDate).toBeUndefined()
        })
    })
})