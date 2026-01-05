import { db, animals } from '@/lib/db'
import { BaseRepository } from './base'
import { eq, and, isNull, like, inArray, count } from 'drizzle-orm'

export interface Animal {
    id: string
    farmId: string
    tagNumber?: string
    type: 'INDIVIDUAL' | 'LOT'
    species: string
    sex?: 'MALE' | 'FEMALE'
    birthDate?: Date
    estimatedAge?: number
    status: 'ACTIVE' | 'SOLD' | 'DEAD'
    photoUrl?: string
    lotCount?: number
    createdBy: string
    createdAt: Date
    updatedBy: string
    updatedAt: Date
    deletedAt: Date | null
}

export interface AnimalFilters {
    species?: string
    type?: 'INDIVIDUAL' | 'LOT'
    status?: 'ACTIVE' | 'SOLD' | 'DEAD'
    sex?: 'MALE' | 'FEMALE'
    tagNumber?: string
}

export interface CreateAnimalData {
    farmId: string
    tagNumber?: string
    type: 'INDIVIDUAL' | 'LOT'
    species: string
    sex?: 'MALE' | 'FEMALE'
    birthDate?: Date
    estimatedAge?: number
    status?: 'ACTIVE' | 'SOLD' | 'DEAD'
    photoUrl?: string
    lotCount?: number
    createdBy: string
    updatedBy?: string
}

export interface UpdateAnimalData {
    tagNumber?: string
    species?: string
    sex?: 'MALE' | 'FEMALE'
    birthDate?: Date
    estimatedAge?: number
    status?: 'ACTIVE' | 'SOLD' | 'DEAD'
    photoUrl?: string
    lotCount?: number
    updatedBy: string
}

export class AnimalRepository extends BaseRepository<Animal> {
    constructor() {
        super(animals)
    }

    async findByFarmId(farmId: string, filters?: AnimalFilters): Promise<Animal[]> {
        let conditions = [
            eq(animals.farmId, farmId),
            isNull(animals.deletedAt)
        ]

        if (filters?.species) {
            conditions.push(like(animals.species, `%${filters.species}%`))
        }

        if (filters?.type) {
            conditions.push(eq(animals.type, filters.type))
        }

        if (filters?.status) {
            conditions.push(eq(animals.status, filters.status))
        }

        if (filters?.sex) {
            conditions.push(eq(animals.sex, filters.sex))
        }

        if (filters?.tagNumber) {
            conditions.push(like(animals.tagNumber, `%${filters.tagNumber}%`))
        }

        const result = await db
            .select()
            .from(animals)
            .where(and(...conditions))
            .orderBy(animals.createdAt)

        return result as Animal[]
    }

    async findByIds(ids: string[]): Promise<Animal[]> {
        if (ids.length === 0) return []

        const result = await db
            .select()
            .from(animals)
            .where(and(
                inArray(animals.id, ids),
                isNull(animals.deletedAt)
            ))

        return result as Animal[]
    }

    async countByFarmId(farmId: string, status?: 'ACTIVE' | 'SOLD' | 'DEAD'): Promise<number> {
        let conditions = [
            eq(animals.farmId, farmId),
            isNull(animals.deletedAt)
        ]

        if (status) {
            conditions.push(eq(animals.status, status))
        }

        const result = await db
            .select({ count: count() })
            .from(animals)
            .where(and(...conditions))

        return Number(result[0]?.count ?? 0)
    }

    async findByTagNumber(farmId: string, tagNumber: string): Promise<Animal | null> {
        const result = await db
            .select()
            .from(animals)
            .where(and(
                eq(animals.farmId, farmId),
                eq(animals.tagNumber, tagNumber),
                isNull(animals.deletedAt)
            ))
            .limit(1)

        return result[0] as Animal || null
    }

    async validateAnimalData(data: CreateAnimalData): Promise<string[]> {
        const errors: string[] = []

        // Required fields validation
        if (!data.species?.trim()) {
            errors.push('Species is required')
        }

        if (!data.type) {
            errors.push('Type is required')
        }

        if (!data.farmId) {
            errors.push('Farm ID is required')
        }

        if (!data.createdBy) {
            errors.push('Created by is required')
        }

        // Tag number validation
        if (data.tagNumber) {
            // Check if tag number is unique within the farm
            const existingAnimal = await this.findByTagNumber(data.farmId, data.tagNumber)
            if (existingAnimal) {
                errors.push('Tag number already exists in this farm')
            }

            // Validate tag number format (alphanumeric, max 20 characters)
            if (!/^[A-Za-z0-9-_]+$/.test(data.tagNumber)) {
                errors.push('Tag number can only contain letters, numbers, hyphens, and underscores')
            }

            if (data.tagNumber.length > 20) {
                errors.push('Tag number cannot exceed 20 characters')
            }
        }

        // Type-specific validation
        if (data.type === 'INDIVIDUAL' && data.lotCount) {
            errors.push('Individual animals cannot have lot count')
        }

        if (data.type === 'LOT' && !data.lotCount) {
            errors.push('Lot animals must have lot count')
        }

        if (data.type === 'LOT' && data.sex) {
            errors.push('Lot animals cannot have sex specified')
        }

        // Validate enum values
        if (data.type && !['INDIVIDUAL', 'LOT'].includes(data.type)) {
            errors.push('Type must be INDIVIDUAL or LOT')
        }

        if (data.status && !['ACTIVE', 'SOLD', 'DEAD'].includes(data.status)) {
            errors.push('Status must be ACTIVE, SOLD, or DEAD')
        }

        if (data.sex && !['MALE', 'FEMALE'].includes(data.sex)) {
            errors.push('Sex must be MALE or FEMALE')
        }

        // Age validation
        if (data.estimatedAge !== undefined && data.estimatedAge < 0) {
            errors.push('Estimated age cannot be negative')
        }

        if (data.lotCount !== undefined && data.lotCount <= 0) {
            errors.push('Lot count must be positive')
        }

        return errors
    }

    async create(data: CreateAnimalData): Promise<Animal> {
        const errors = await this.validateAnimalData(data)
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`)
        }

        // Set default values
        const animalData = {
            ...data,
            status: data.status || 'ACTIVE' as const,
            updatedBy: data.updatedBy || data.createdBy
        }

        return await super.create(animalData)
    }

    async update(id: string, data: UpdateAnimalData): Promise<Animal | null> {
        const existing = await this.findById(id)
        if (!existing) {
            throw new Error('Animal not found')
        }

        // Validate enum values if provided
        if (data.status && !['ACTIVE', 'SOLD', 'DEAD'].includes(data.status)) {
            throw new Error('Status must be ACTIVE, SOLD, or DEAD')
        }

        if (data.sex && !['MALE', 'FEMALE'].includes(data.sex)) {
            throw new Error('Sex must be MALE or FEMALE')
        }

        // Type-specific validation
        if (existing.type === 'LOT' && data.sex) {
            throw new Error('Lot animals cannot have sex specified')
        }

        if (data.estimatedAge !== undefined && data.estimatedAge < 0) {
            throw new Error('Estimated age cannot be negative')
        }

        if (data.lotCount !== undefined && data.lotCount <= 0) {
            throw new Error('Lot count must be positive')
        }

        return await super.update(id, data)
    }
}

export const animalRepository = new AnimalRepository()