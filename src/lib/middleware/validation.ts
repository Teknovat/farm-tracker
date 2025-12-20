import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema, ZodError } from 'zod'
import { ApiResponse } from '@/lib/types'
import { getLocaleFromRequest, type Locale } from '@/lib/utils/i18n-errors'
import * as validationSchemas from './validation-schemas'

export interface ValidationResult<T> {
    success: boolean
    data?: T
    errors?: Array<{ field: string; message: string; code?: string }>
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
                message: err.message,
                code: err.code
            }))
            return { success: false, errors }
        }
        return {
            success: false,
            errors: [{ field: 'general', message: 'Validation failed', code: 'VALIDATION_ERROR' }]
        }
    }
}

/**
 * Validate request body with translated error messages
 */
export async function validateRequestBodyWithLocale<T>(
    schemaFactory: (locale: Locale) => Promise<ZodSchema<T>>,
    body: any,
    locale: Locale = 'fr'
): Promise<ValidationResult<T>> {
    try {
        const schema = await schemaFactory(locale)
        const data = schema.parse(body)
        return { success: true, data }
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            }))
            return { success: false, errors }
        }
        return {
            success: false,
            errors: [{ field: 'general', message: 'Validation failed', code: 'VALIDATION_ERROR' }]
        }
    }
}

/**
 * Get validation schema factories with locale support
 */
export function getValidationSchemas() {
    return validationSchemas
}

export function createValidationResponse(errors: Array<{ field: string; message: string; code?: string }>): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors
        } as ApiResponse,
        { status: 400 }
    )
}

// Enhanced validation schemas with better error messages
export const depositSchema = z.object({
    amount: z.number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number'
    }).positive('Amount must be positive').max(1000000, 'Amount cannot exceed 1,000,000'),
    description: z.string({
        required_error: 'Description is required'
    }).min(1, 'Description cannot be empty').max(255, 'Description cannot exceed 255 characters').trim()
})

export const cashExpenseSchema = z.object({
    amount: z.number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number'
    }).positive('Amount must be positive').max(1000000, 'Amount cannot exceed 1,000,000'),
    description: z.string({
        required_error: 'Description is required'
    }).min(1, 'Description cannot be empty').max(255, 'Description cannot exceed 255 characters').trim(),
    category: z.enum(['FEED', 'VET', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'UTILITIES', 'OTHER'], {
        required_error: 'Category is required',
        invalid_type_error: 'Invalid category selected'
    })
})

export const creditExpenseSchema = z.object({
    amount: z.number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number'
    }).positive('Amount must be positive').max(1000000, 'Amount cannot exceed 1,000,000'),
    description: z.string({
        required_error: 'Description is required'
    }).min(1, 'Description cannot be empty').max(255, 'Description cannot exceed 255 characters').trim(),
    category: z.enum(['FEED', 'VET', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'UTILITIES', 'OTHER'], {
        required_error: 'Category is required',
        invalid_type_error: 'Invalid category selected'
    }),
    paidBy: z.string({
        required_error: 'Paid by user ID is required'
    }).uuid('Invalid user ID format')
})

export const reimbursementSchema = z.object({
    creditExpenseId: z.string({
        required_error: 'Credit expense ID is required'
    }).uuid('Invalid expense ID format'),
    amount: z.number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number'
    }).positive('Amount must be positive').max(1000000, 'Amount cannot exceed 1,000,000'),
    description: z.string().max(255, 'Description cannot exceed 255 characters').trim().optional()
})

export const animalCreateSchema = z.object({
    type: z.enum(['INDIVIDUAL', 'LOT'], {
        required_error: 'Animal type is required',
        invalid_type_error: 'Type must be either INDIVIDUAL or LOT'
    }),
    species: z.string({
        required_error: 'Species is required'
    }).min(1, 'Species cannot be empty').max(100, 'Species name cannot exceed 100 characters').trim(),
    sex: z.enum(['MALE', 'FEMALE'], {
        invalid_type_error: 'Sex must be either MALE or FEMALE'
    }).optional(),
    birthDate: z.string().datetime('Invalid date format').optional(),
    estimatedAge: z.number({
        invalid_type_error: 'Age must be a number'
    }).int('Age must be a whole number').min(0, 'Age cannot be negative').max(50, 'Age cannot exceed 50 years').optional(),
    status: z.enum(['ACTIVE', 'SOLD', 'DEAD'], {
        invalid_type_error: 'Invalid status'
    }).default('ACTIVE'),
    photoUrl: z.string().url('Invalid photo URL format').optional(),
    lotCount: z.number({
        invalid_type_error: 'Lot count must be a number'
    }).int('Lot count must be a whole number').positive('Lot count must be positive').max(10000, 'Lot count cannot exceed 10,000').optional()
}).refine(data => {
    // If type is LOT, lotCount is required
    if (data.type === 'LOT' && !data.lotCount) {
        return false
    }
    // If type is INDIVIDUAL, lotCount should not be provided
    if (data.type === 'INDIVIDUAL' && data.lotCount) {
        return false
    }
    return true
}, {
    message: 'Lot count is required for LOT type animals and should not be provided for INDIVIDUAL animals',
    path: ['lotCount']
})

export const animalUpdateSchema = z.object({
    species: z.string().min(1, 'Species cannot be empty').max(100, 'Species name cannot exceed 100 characters').trim().optional(),
    sex: z.enum(['MALE', 'FEMALE'], {
        invalid_type_error: 'Sex must be either MALE or FEMALE'
    }).optional(),
    birthDate: z.string().datetime('Invalid date format').optional(),
    estimatedAge: z.number({
        invalid_type_error: 'Age must be a number'
    }).int('Age must be a whole number').min(0, 'Age cannot be negative').max(50, 'Age cannot exceed 50 years').optional(),
    status: z.enum(['ACTIVE', 'SOLD', 'DEAD'], {
        invalid_type_error: 'Invalid status'
    }).optional(),
    photoUrl: z.string().url('Invalid photo URL format').optional(),
    lotCount: z.number({
        invalid_type_error: 'Lot count must be a number'
    }).int('Lot count must be a whole number').positive('Lot count must be positive').max(10000, 'Lot count cannot exceed 10,000').optional()
})

export const eventCreateSchema = z.object({
    targetId: z.string({
        required_error: 'Target animal/lot ID is required'
    }).uuid('Invalid target ID format'),
    targetType: z.enum(['ANIMAL', 'LOT'], {
        required_error: 'Target type is required',
        invalid_type_error: 'Target type must be either ANIMAL or LOT'
    }),
    eventType: z.enum(['BIRTH', 'VACCINATION', 'TREATMENT', 'WEIGHT', 'SALE', 'DEATH', 'NOTE'], {
        required_error: 'Event type is required',
        invalid_type_error: 'Invalid event type'
    }),
    eventDate: z.string({
        required_error: 'Event date is required'
    }).datetime('Invalid date format'),
    payload: z.record(z.any()).default({}),
    note: z.string().max(1000, 'Note cannot exceed 1000 characters').trim().optional(),
    cost: z.number({
        invalid_type_error: 'Cost must be a number'
    }).min(0, 'Cost cannot be negative').max(1000000, 'Cost cannot exceed 1,000,000').optional(),
    nextDueDate: z.string().datetime('Invalid next due date format').optional(),
    attachmentUrl: z.string().url('Invalid attachment URL format').optional()
}).refine(data => {
    // Sale events must have a cost
    if (data.eventType === 'SALE' && (!data.cost || data.cost <= 0)) {
        return false
    }
    return true
}, {
    message: 'Sale events must have a positive cost value',
    path: ['cost']
})

export const eventUpdateSchema = z.object({
    eventDate: z.string().datetime('Invalid date format').optional(),
    payload: z.record(z.any()).optional(),
    note: z.string().max(1000, 'Note cannot exceed 1000 characters').trim().optional(),
    cost: z.number({
        invalid_type_error: 'Cost must be a number'
    }).min(0, 'Cost cannot be negative').max(1000000, 'Cost cannot exceed 1,000,000').optional(),
    nextDueDate: z.string().datetime('Invalid next due date format').optional(),
    attachmentUrl: z.string().url('Invalid attachment URL format').optional()
})

export const farmCreateSchema = z.object({
    name: z.string({
        required_error: 'Farm name is required'
    }).min(1, 'Farm name cannot be empty').max(100, 'Farm name cannot exceed 100 characters').trim(),
    currency: z.string().length(3, 'Currency must be exactly 3 characters (e.g., TND, USD)').default('TND'),
    timezone: z.string().default('Africa/Tunis')
})

export const farmUpdateSchema = z.object({
    name: z.string().min(1, 'Farm name cannot be empty').max(100, 'Farm name cannot exceed 100 characters').trim().optional(),
    currency: z.string().length(3, 'Currency must be exactly 3 characters (e.g., TND, USD)').optional(),
    timezone: z.string().optional()
})

export const memberInviteSchema = z.object({
    email: z.string({
        required_error: 'Email is required'
    }).email('Invalid email address format').toLowerCase(),
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER'], {
        required_error: 'Role is required',
        invalid_type_error: 'Invalid role selected'
    })
})

export const memberUpdateSchema = z.object({
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER'], {
        required_error: 'Role is required',
        invalid_type_error: 'Invalid role selected'
    })
})

// Utility function to validate query parameters with enhanced error handling
export function validateQueryParams<T>(
    schema: ZodSchema<T>,
    searchParams: URLSearchParams
): ValidationResult<T> {
    const params: Record<string, any> = {}

    for (const [key, value] of searchParams.entries()) {
        // Handle array parameters (comma-separated values)
        if (value.includes(',')) {
            params[key] = value.split(',').map(v => v.trim())
        } else {
            // Try to parse as number or boolean
            if (value === 'true') params[key] = true
            else if (value === 'false') params[key] = false
            else if (!isNaN(Number(value)) && value !== '') params[key] = Number(value)
            else params[key] = value.trim()
        }
    }

    return validateRequestBody(schema, params)
}

// Enhanced error handling utility with detailed error mapping
export function handleValidationError(error: unknown): NextResponse {
    if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
        }))
        return createValidationResponse(errors)
    }

    console.error('Validation error:', error)
    return NextResponse.json(
        {
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR'
        } as ApiResponse,
        { status: 400 }
    )
}

// Query parameter validation schemas
export const animalFiltersSchema = z.object({
    species: z.string().optional(),
    type: z.enum(['INDIVIDUAL', 'LOT']).optional(),
    status: z.enum(['ACTIVE', 'SOLD', 'DEAD']).optional(),
    sex: z.enum(['MALE', 'FEMALE']).optional(),
    limit: z.number().int().min(1).max(100).default(50).optional(),
    offset: z.number().int().min(0).default(0).optional()
})

export const eventFiltersSchema = z.object({
    targetId: z.string().uuid().optional(),
    eventType: z.enum(['BIRTH', 'VACCINATION', 'TREATMENT', 'WEIGHT', 'SALE', 'DEATH', 'NOTE']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    hasNextDueDate: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).default(50).optional(),
    offset: z.number().int().min(0).default(0).optional()
})

export const cashboxFiltersSchema = z.object({
    type: z.enum(['DEPOSIT', 'EXPENSE_CASH', 'EXPENSE_CREDIT', 'REIMBURSEMENT']).optional(),
    category: z.enum(['FEED', 'VET', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'UTILITIES', 'OTHER']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(100).default(50).optional(),
    offset: z.number().int().min(0).default(0).optional()
})

// Validation helper functions
export function validateDateRange(startDate?: string, endDate?: string): boolean {
    if (!startDate || !endDate) return true

    const start = new Date(startDate)
    const end = new Date(endDate)

    return start <= end
}

export function validateFutureDate(date: string, allowFuture: boolean = true): boolean {
    const inputDate = new Date(date)
    const now = new Date()

    if (!allowFuture && inputDate > now) {
        return false
    }

    return true
}

// Custom validation error messages for different locales
export const ValidationMessages = {
    en: {
        required: 'This field is required',
        invalid_email: 'Invalid email address',
        invalid_url: 'Invalid URL format',
        invalid_uuid: 'Invalid ID format',
        positive_number: 'Must be a positive number',
        future_date_not_allowed: 'Future dates are not allowed',
        invalid_date_range: 'Start date must be before end date'
    },
    fr: {
        required: 'Ce champ est requis',
        invalid_email: 'Adresse email invalide',
        invalid_url: 'Format d\'URL invalide',
        invalid_uuid: 'Format d\'ID invalide',
        positive_number: 'Doit être un nombre positif',
        future_date_not_allowed: 'Les dates futures ne sont pas autorisées',
        invalid_date_range: 'La date de début doit être antérieure à la date de fin'
    },
    ar: {
        required: 'هذا الحقل مطلوب',
        invalid_email: 'عنوان بريد إلكتروني غير صحيح',
        invalid_url: 'تنسيق URL غير صحيح',
        invalid_uuid: 'تنسيق المعرف غير صحيح',
        positive_number: 'يجب أن يكون رقماً موجباً',
        future_date_not_allowed: 'التواريخ المستقبلية غير مسموحة',
        invalid_date_range: 'يجب أن يكون تاريخ البداية قبل تاريخ النهاية'
    }
}