import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema, ZodError } from 'zod'
import { ApiResponse } from '@/lib/types'

export interface ValidationResult<T> {
    success: boolean
    data?: T
    errors?: Array<{ field: string; message: string }>
}

export function validateRequestBody<T>(
    schema: ZodSchema<T>,
    body: any
): ValidationResult<T> {
    try {
        const data = schema.parse(body)
        return { success: true, data }
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
            return { success: false, errors }
        }
        return {
            success: false,
            errors: [{ field: 'general', message: 'Validation failed' }]
        }
    }
}

export function createValidationResponse(errors: Array<{ field: string; message: string }>): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: 'Validation failed',
            details: errors
        } as ApiResponse,
        { status: 400 }
    )
}

// Common validation schemas
export const depositSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255, 'Description too long')
})

export const cashExpenseSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
    category: z.enum(['FEED', 'VET', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'UTILITIES', 'OTHER'])
})

export const creditExpenseSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
    category: z.enum(['FEED', 'VET', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'UTILITIES', 'OTHER']),
    paidBy: z.string().uuid('Invalid user ID')
})

export const reimbursementSchema = z.object({
    creditExpenseId: z.string().uuid('Invalid expense ID'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().max(255, 'Description too long').optional()
})

export const animalCreateSchema = z.object({
    type: z.enum(['INDIVIDUAL', 'LOT']),
    species: z.string().min(1, 'Species is required').max(100, 'Species name too long'),
    sex: z.enum(['MALE', 'FEMALE']).optional(),
    birthDate: z.string().datetime().optional(),
    estimatedAge: z.number().int().min(0).optional(),
    status: z.enum(['ACTIVE', 'SOLD', 'DEAD']).default('ACTIVE'),
    photoUrl: z.string().url().optional(),
    lotCount: z.number().int().positive().optional()
})

export const animalUpdateSchema = z.object({
    species: z.string().min(1, 'Species is required').max(100, 'Species name too long').optional(),
    sex: z.enum(['MALE', 'FEMALE']).optional(),
    birthDate: z.string().datetime().optional(),
    estimatedAge: z.number().int().min(0).optional(),
    status: z.enum(['ACTIVE', 'SOLD', 'DEAD']).optional(),
    photoUrl: z.string().url().optional(),
    lotCount: z.number().int().positive().optional()
})

export const eventCreateSchema = z.object({
    targetId: z.string().uuid('Invalid target ID'),
    targetType: z.enum(['ANIMAL', 'LOT']),
    eventType: z.enum(['BIRTH', 'VACCINATION', 'TREATMENT', 'WEIGHT', 'SALE', 'DEATH', 'NOTE']),
    eventDate: z.string().datetime(),
    payload: z.record(z.any()).default({}),
    note: z.string().max(1000, 'Note too long').optional(),
    cost: z.number().min(0).optional(),
    nextDueDate: z.string().datetime().optional(),
    attachmentUrl: z.string().url().optional()
})

export const eventUpdateSchema = z.object({
    eventDate: z.string().datetime().optional(),
    payload: z.record(z.any()).optional(),
    note: z.string().max(1000, 'Note too long').optional(),
    cost: z.number().min(0).optional(),
    nextDueDate: z.string().datetime().optional(),
    attachmentUrl: z.string().url().optional()
})

export const farmCreateSchema = z.object({
    name: z.string().min(1, 'Farm name is required').max(100, 'Farm name too long'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('TND'),
    timezone: z.string().default('Africa/Tunis')
})

export const farmUpdateSchema = z.object({
    name: z.string().min(1, 'Farm name is required').max(100, 'Farm name too long').optional(),
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    timezone: z.string().optional()
})

export const memberInviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER'])
})

export const memberUpdateSchema = z.object({
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER'])
})

// Utility function to validate query parameters
export function validateQueryParams<T>(
    schema: ZodSchema<T>,
    searchParams: URLSearchParams
): ValidationResult<T> {
    const params: Record<string, any> = {}

    for (const [key, value] of searchParams.entries()) {
        // Handle array parameters (comma-separated values)
        if (value.includes(',')) {
            params[key] = value.split(',')
        } else {
            // Try to parse as number or boolean
            if (value === 'true') params[key] = true
            else if (value === 'false') params[key] = false
            else if (!isNaN(Number(value)) && value !== '') params[key] = Number(value)
            else params[key] = value
        }
    }

    return validateRequestBody(schema, params)
}

// Error handling utility
export function handleValidationError(error: unknown): NextResponse {
    if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }))
        return createValidationResponse(errors)
    }

    console.error('Validation error:', error)
    return NextResponse.json(
        {
            success: false,
            error: 'Validation failed'
        } as ApiResponse,
        { status: 400 }
    )
}