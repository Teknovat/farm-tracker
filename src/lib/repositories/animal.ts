import { db, animals, users } from '@/lib/db'
import { BaseRepository } from './base'
import { eq, and, isNull, like, inArray, count, ne, or } from 'drizzle-orm'

// Base animal interface (data stored in database)
export interface AnimalDB {
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
    fatherId?: string
    motherId?: string
    createdBy: string
    createdAt: Date
    updatedBy: string
    updatedAt: Date
    deletedAt: Date | null
}

// Animal interface with user names (for API responses)
export interface Animal extends AnimalDB {
    createdByName: string
    updatedByName: string
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
    fatherId?: string
    motherId?: string
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
    fatherId?: string
    motherId?: string
    updatedBy: string
}

export class AnimalRepository extends BaseRepository<AnimalDB> {
    constructor() {
        super(animals)
    }

    // Override findById to include user information
    async findById(id: string): Promise<Animal | null> {
        // First, get the animal
        const animalResult = await db
            .select()
            .from(animals)
            .where(and(
                eq(animals.id, id),
                isNull(animals.deletedAt)
            ))
            .limit(1)

        if (animalResult.length === 0) {
            return null
        }

        const animal = animalResult[0]

        // Get creator name
        const creatorResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, animal.createdBy))
            .limit(1)

        // Get updater name
        const updaterResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, animal.updatedBy))
            .limit(1)

        return {
            ...animal,
            createdAt: new Date(animal.createdAt),
            updatedAt: new Date(animal.updatedAt),
            birthDate: animal.birthDate ? new Date(animal.birthDate) : undefined,
            deletedAt: animal.deletedAt ? new Date(animal.deletedAt) : null,
            createdByName: creatorResult[0]?.name || 'Unknown user',
            updatedByName: updaterResult[0]?.name || 'Unknown user',
        } as Animal
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

        // Get animals first
        const animalResults = await db
            .select()
            .from(animals)
            .where(and(...conditions))
            .orderBy(animals.createdAt)

        // Get unique user IDs
        const userIds = new Set<string>()
        animalResults.forEach(animal => {
            userIds.add(animal.createdBy)
            userIds.add(animal.updatedBy)
        })

        // Get user names in one query
        const userResults = await db
            .select()
            .from(users)
            .where(inArray(users.id, Array.from(userIds)))

        // Create a map of user ID to name
        const userMap = new Map<string, string>()
        userResults.forEach(user => {
            userMap.set(user.id, user.name)
        })

        // Combine animal data with user names
        return animalResults.map(animal => ({
            ...animal,
            createdAt: new Date(animal.createdAt),
            updatedAt: new Date(animal.updatedAt),
            birthDate: animal.birthDate ? new Date(animal.birthDate) : undefined,
            deletedAt: animal.deletedAt ? new Date(animal.deletedAt) : null,
            createdByName: userMap.get(animal.createdBy) || 'Unknown user',
            updatedByName: userMap.get(animal.updatedBy) || 'Unknown user',
        })) as Animal[]
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

        // Parent validation
        if (data.fatherId) {
            const father = await this.findById(data.fatherId)
            if (!father) {
                errors.push('Father animal not found')
            } else if (father.farmId !== data.farmId) {
                errors.push('Father animal must be from the same farm')
            } else if (father.sex !== 'MALE') {
                errors.push('Father animal must be male')
            }
        }

        if (data.motherId) {
            const mother = await this.findById(data.motherId)
            if (!mother) {
                errors.push('Mother animal not found')
            } else if (mother.farmId !== data.farmId) {
                errors.push('Mother animal must be from the same farm')
            } else if (mother.sex !== 'FEMALE') {
                errors.push('Mother animal must be female')
            }
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

        const created = await super.create(animalData)

        // Return the created animal with user names
        const animalWithNames = await this.findById(created.id)
        if (!animalWithNames) {
            throw new Error('Failed to fetch created animal with user names')
        }
        return animalWithNames
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

        // Parent validation for updates
        if (data.fatherId !== undefined) {
            if (data.fatherId === id) {
                throw new Error('Animal cannot be its own father')
            }
            if (data.fatherId) {
                const father = await this.findById(data.fatherId)
                if (!father) {
                    throw new Error('Father animal not found')
                } else if (father.farmId !== existing.farmId) {
                    throw new Error('Father animal must be from the same farm')
                } else if (father.sex !== 'MALE') {
                    throw new Error('Father animal must be male')
                }
            }
        }

        if (data.motherId !== undefined) {
            if (data.motherId === id) {
                throw new Error('Animal cannot be its own mother')
            }
            if (data.motherId) {
                const mother = await this.findById(data.motherId)
                if (!mother) {
                    throw new Error('Mother animal not found')
                } else if (mother.farmId !== existing.farmId) {
                    throw new Error('Mother animal must be from the same farm')
                } else if (mother.sex !== 'FEMALE') {
                    throw new Error('Mother animal must be female')
                }
            }
        }

        await super.update(id, data)

        // Return the updated animal with user names
        return await this.findById(id)
    }

    async getOffspring(animalId: string): Promise<Animal[]> {
        const result = await db
            .select()
            .from(animals)
            .where(and(
                isNull(animals.deletedAt),
                eq(animals.fatherId, animalId)
            ))

        const motherOffspring = await db
            .select()
            .from(animals)
            .where(and(
                isNull(animals.deletedAt),
                eq(animals.motherId, animalId)
            ))

        // Combine and deduplicate results
        const allOffspring = [...result, ...motherOffspring]
        const uniqueOffspring = allOffspring.filter((animal, index, arr) =>
            arr.findIndex(a => a.id === animal.id) === index
        )

        return uniqueOffspring as Animal[]
    }

    // TODO: Implement getSiblings method once Drizzle typing issues are resolved
    async getSiblings(animalId: string): Promise<Animal[]> {
        // Temporary implementation - to be completed later
        return []
    }

    async getParents(animalId: string): Promise<{ father?: Animal, mother?: Animal }> {
        const animal = await this.findById(animalId)
        if (!animal) {
            return {}
        }

        const parents: { father?: Animal, mother?: Animal } = {}

        if (animal.fatherId) {
            const father = await this.findById(animal.fatherId)
            if (father) {
                parents.father = father
            }
        }

        if (animal.motherId) {
            const mother = await this.findById(animal.motherId)
            if (mother) {
                parents.mother = mother
            }
        }

        return parents
    }
}

export const animalRepository = new AnimalRepository()