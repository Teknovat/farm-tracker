import { db, farms, farmMembers, cashboxMovements, users } from '@/lib/db'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { BaseRepository } from './base'

// Base farm interface (data stored in database)
export interface FarmDB {
    id: string
    name: string
    currency: string
    timezone: string
    createdBy: string
    createdAt: Date
    updatedBy: string
    updatedAt: Date
    deletedAt: Date | null
}

// Farm interface with user names (for API responses)
export interface Farm extends FarmDB {
    createdByName: string
    updatedByName: string
}

export interface FarmMember {
    id: string
    userId: string
    farmId: string
    role: 'OWNER' | 'ASSOCIATE' | 'WORKER'
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: Date
    updatedAt: Date
}

export interface FarmMemberWithUser extends FarmMember {
    user: {
        id: string
        name: string
        email: string
    }
}

export interface CreateFarmData {
    name: string
    currency?: string
    timezone?: string
    createdBy: string
}

export interface InviteMemberData {
    farmId: string
    userId: string
    role: 'OWNER' | 'ASSOCIATE' | 'WORKER'
    invitedBy: string
}

export class FarmRepository extends BaseRepository<FarmDB> {
    constructor() {
        super(farms)
    }

    // Override findById to include user information
    async findById(id: string): Promise<Farm | null> {
        // First, get the farm
        const farmResult = await db
            .select()
            .from(farms)
            .where(and(
                eq(farms.id, id),
                isNull(farms.deletedAt)
            ))
            .limit(1)

        if (farmResult.length === 0) {
            return null
        }

        const farm = farmResult[0]

        // Get creator name
        const creatorResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, farm.createdBy))
            .limit(1)

        // Get updater name
        const updaterResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, farm.updatedBy))
            .limit(1)

        return {
            ...farm,
            createdAt: new Date(farm.createdAt),
            updatedAt: new Date(farm.updatedAt),
            deletedAt: farm.deletedAt ? new Date(farm.deletedAt) : null,
            createdByName: creatorResult[0]?.name || 'Unknown user',
            updatedByName: updaterResult[0]?.name || 'Unknown user',
        } as Farm
    }

    async createFarmWithOwner(data: CreateFarmData): Promise<{ farm: Farm; member: FarmMember }> {
        const farmData = {
            name: data.name,
            currency: data.currency || 'TND',
            timezone: data.timezone || 'Africa/Tunis',
            createdBy: data.createdBy,
            updatedBy: data.createdBy,
        }

        const createdFarm = await super.create(farmData)

        // Create farm member with OWNER role
        const memberData = {
            id: crypto.randomUUID(),
            userId: data.createdBy,
            farmId: createdFarm.id,
            role: 'OWNER' as const,
            status: 'ACTIVE' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        await db.insert(farmMembers).values(memberData)

        // Initialize cashbox with zero balance (create initial deposit of 0)
        const cashboxData = {
            id: crypto.randomUUID(),
            farmId: createdFarm.id,
            type: 'DEPOSIT' as const,
            amount: 0,
            description: 'Initial cashbox setup',
            createdBy: data.createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        await db.insert(cashboxMovements).values(cashboxData)

        // Return the farm with user names
        const farmWithUserNames = await this.findById(createdFarm.id)
        if (!farmWithUserNames) {
            throw new Error('Failed to fetch created farm with user names')
        }

        const member = memberData as FarmMember
        return { farm: farmWithUserNames, member }
    }

    async findUserFarms(userId: string): Promise<Farm[]> {
        const farmResults = await db
            .select({
                id: farms.id,
                name: farms.name,
                currency: farms.currency,
                timezone: farms.timezone,
                createdBy: farms.createdBy,
                createdAt: farms.createdAt,
                updatedBy: farms.updatedBy,
                updatedAt: farms.updatedAt,
                deletedAt: farms.deletedAt,
            })
            .from(farms)
            .innerJoin(farmMembers, eq(farms.id, farmMembers.farmId))
            .where(and(
                eq(farmMembers.userId, userId),
                eq(farmMembers.status, 'ACTIVE'),
                isNull(farms.deletedAt)
            ))

        // Get unique user IDs
        const userIds = new Set<string>()
        farmResults.forEach(farm => {
            userIds.add(farm.createdBy)
            userIds.add(farm.updatedBy)
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

        // Combine farm data with user names
        return farmResults.map(farm => ({
            ...farm,
            createdAt: new Date(farm.createdAt),
            updatedAt: new Date(farm.updatedAt),
            deletedAt: farm.deletedAt ? new Date(farm.deletedAt) : null,
            createdByName: userMap.get(farm.createdBy) || 'Unknown user',
            updatedByName: userMap.get(farm.updatedBy) || 'Unknown user',
        })) as Farm[]
    }

    async findFarmMember(farmId: string, userId: string): Promise<FarmMember | null> {
        const result = await db
            .select()
            .from(farmMembers)
            .where(and(
                eq(farmMembers.farmId, farmId),
                eq(farmMembers.userId, userId),
                eq(farmMembers.status, 'ACTIVE')
            ))
            .limit(1)

        return result[0] as FarmMember || null
    }

    async findFarmMembers(farmId: string): Promise<FarmMemberWithUser[]> {
        const result = await db
            .select({
                id: farmMembers.id,
                userId: farmMembers.userId,
                farmId: farmMembers.farmId,
                role: farmMembers.role,
                status: farmMembers.status,
                createdAt: farmMembers.createdAt,
                updatedAt: farmMembers.updatedAt,
                user: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                }
            })
            .from(farmMembers)
            .innerJoin(users, eq(farmMembers.userId, users.id))
            .where(and(
                eq(farmMembers.farmId, farmId),
                eq(farmMembers.status, 'ACTIVE')
            ))

        return result as FarmMemberWithUser[]
    }

    async inviteMember(data: InviteMemberData): Promise<FarmMember> {
        // Check if user is already a member
        const existingMember = await this.findFarmMember(data.farmId, data.userId)
        if (existingMember) {
            throw new Error('User is already a member of this farm')
        }

        const memberData = {
            id: crypto.randomUUID(),
            userId: data.userId,
            farmId: data.farmId,
            role: data.role,
            status: 'ACTIVE' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        await db.insert(farmMembers).values(memberData)

        const member = await db
            .select()
            .from(farmMembers)
            .where(eq(farmMembers.id, memberData.id))
            .limit(1)

        return member[0] as FarmMember
    }

    async updateMemberRole(farmId: string, userId: string, role: 'OWNER' | 'ASSOCIATE' | 'WORKER', updatedBy: string): Promise<FarmMember | null> {
        await db
            .update(farmMembers)
            .set({
                role,
                updatedAt: new Date()
            })
            .where(and(
                eq(farmMembers.farmId, farmId),
                eq(farmMembers.userId, userId),
                eq(farmMembers.status, 'ACTIVE')
            ))

        return await this.findFarmMember(farmId, userId)
    }

    async removeMember(farmId: string, userId: string): Promise<boolean> {
        const result = await db
            .update(farmMembers)
            .set({
                status: 'INACTIVE',
                updatedAt: new Date()
            })
            .where(and(
                eq(farmMembers.farmId, farmId),
                eq(farmMembers.userId, userId),
                eq(farmMembers.status, 'ACTIVE')
            ))

        return result.rowsAffected > 0
    }

    // Override update method to include audit trail
    async update(id: string, data: Partial<Omit<Farm, 'id' | 'createdAt'>>): Promise<Farm | null> {
        const updateData = {
            ...data,
            updatedAt: new Date(),
        }

        await db
            .update(this.table)
            .set(updateData)
            .where(and(
                eq(this.table.id, id),
                isNull(this.table.deletedAt)
            ))

        return await this.findById(id)
    }

    // New method specifically for farm updates with audit trail
    async updateFarm(id: string, data: Partial<Omit<Farm, 'id' | 'createdAt'>>, updatedBy: string): Promise<Farm | null> {
        const updateData = {
            ...data,
            updatedBy,
            updatedAt: new Date(),
        }

        await db
            .update(this.table)
            .set(updateData)
            .where(and(
                eq(this.table.id, id),
                isNull(this.table.deletedAt)
            ))

        return await this.findById(id)
    }
}