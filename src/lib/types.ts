// Re-export database types for convenience
export type { Farm, FarmMember } from '@/lib/repositories/farm'
export type { User } from '@/lib/repositories/user'
export type { Animal } from '@/lib/repositories/animal'
export type { Event } from '@/lib/repositories/event'

// Role type for type safety
export type Role = 'OWNER' | 'ASSOCIATE' | 'WORKER'

// API Response types
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
    code?: string
    details?: Array<{ field: string; message: string; code?: string }>
}

// Form validation types
export interface ValidationError {
    field: string
    message: string
    code?: string
}

// Enhanced error types for better error handling
export interface ErrorContext {
    operation?: string
    userId?: string
    farmId?: string
    resourceId?: string
    timestamp?: string
    userAgent?: string
    ip?: string
}

// Event payload types based on event type
export interface BirthEventPayload {
    parentId?: string
    weight?: number
    complications?: string
}

export interface VaccinationEventPayload {
    vaccine: string
    dose?: string
    batchNumber?: string
    veterinarian?: string
}

export interface TreatmentEventPayload {
    treatment: string
    medication?: string
    dosage?: string
    veterinarian?: string
}

export interface WeightEventPayload {
    weight: number
    unit: 'kg' | 'lb'
}

export interface SaleEventPayload {
    buyer: string
    price: number
    weight?: number
}

export interface DeathEventPayload {
    cause?: string
    veterinarianReport?: boolean
}

export interface NoteEventPayload {
    category?: string
}

export type EventPayload =
    | BirthEventPayload
    | VaccinationEventPayload
    | TreatmentEventPayload
    | WeightEventPayload
    | SaleEventPayload
    | DeathEventPayload
    | NoteEventPayload