import { db } from '@/lib/db'
import { farmMembers, users } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export interface FarmMember {
    id: string
    userId: string
    farmId: string
    role: 'OWNER' | 'ASSOCIATE' | 'WORKER'
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: Date
    updatedAt: Date
    // User details
    userName: string
    userEmail: string
}

export interface CreateFarmMemberData {
    userId: string
    farmId: string
    role: 'OWNER' | 'ASSOCIATE' | 'WORKER'
    status?: 'ACTIVE' | 'INACTIVE'
}

export interface UpdateFarmMemberData {
    role?: 'OWNER' | 'ASSOCIATE' | 'WORKER'
    status?: 'ACTIVE' | 'INACTIVE'
}

export interface FarmMemberFilters {
    status?: 'ACTIVE' | 'INACTIVE'
    role?: 'OWNER' | 'ASSOCIATE' | 'WORKER'
}

export class FarmMemberRepository {
    async findByFarmId(farmId: string, filters?: FarmMemberFilters): Promise<FarmMember[]> {
        const conditions = [eq(farmMembers.farmId, farmId)]

        if (filters?.status) {
            conditions.push(eq(farmMembers.status, filters.status))
        }

        if (filters?.role) {
            conditions.push(eq(farmMembers.role, filters.role))
        }

        const result = await db
            .select({
                id: farmMembers.id,
                userId: farmMembers.userId,
                farmId: farmMembers.farmId,
                role: farmMembers.role,
                status: farmMembers.status,
                createdAt: farmMembers.createdAt,
                updatedAt: farmMembers.updatedAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(farmMembers)
            .innerJoin(users, eq(farmMembers.userId, users.id))
            .where(and(...conditions))
            .orderBy(farmMembers.createdAt)

        return result.map(row => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        }))
    }

    async findById(id: string): Promise<FarmMember | null> {
        const result = await db
            .select({
                id: farmMembers.id,
                userId: farmMembers.userId,
                farmId: farmMembers.farmId,
                role: farmMembers.role,
                status: farmMembers.status,
                createdAt: farmMembers.createdAt,
                updatedAt: farmMembers.updatedAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(farmMembers)
            .innerJoin(users, eq(farmMembers.userId, users.id))
            .where(eq(farmMembers.id, id))
            .limit(1)

        if (result.length === 0) {
            return null
        }

        const row = result[0]
        return {
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        }
    }

    async findByUserAndFarm(userId: string, farmId: string): Promise<FarmMember | null> {
        const result = await db
            .select({
                id: farmMembers.id,
                userId: farmMembers.userId,
                farmId: farmMembers.farmId,
                role: farmMembers.role,
                status: farmMembers.status,
                createdAt: farmMembers.createdAt,
                updatedAt: farmMembers.updatedAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(farmMembers)
            .innerJoin(users, eq(farmMembers.userId, users.id))
            .where(and(
                eq(farmMembers.userId, userId),
                eq(farmMembers.farmId, farmId)
            ))
            .limit(1)

        if (result.length === 0) {
            return null
        }

        const row = result[0]
        return {
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        }
    }

    async create(data: CreateFarmMemberData): Promise<FarmMember> {
        const id = crypto.randomUUID()
        const now = new Date()

        await db.insert(farmMembers).values({
            id,
            userId: data.userId,
            farmId: data.farmId,
            role: data.role,
            status: data.status || 'ACTIVE',
            createdAt: now,
            updatedAt: now,
        })

        const created = await this.findById(id)
        if (!created) {
            throw new Error('Failed to create farm member')
        }

        return created
    }

    async update(id: string, data: UpdateFarmMemberData): Promise<FarmMember> {
        const now = new Date()

        await db
            .update(farmMembers)
            .set({
                ...data,
                updatedAt: now,
            })
            .where(eq(farmMembers.id, id))

        const updated = await this.findById(id)
        if (!updated) {
            throw new Error('Farm member not found after update')
        }

        return updated
    }

    async delete(id: string): Promise<void> {
        await db
            .delete(farmMembers)
            .where(eq(farmMembers.id, id))
    }

    async countOwners(farmId: string): Promise<number> {
        const result = await db
            .select({ count: farmMembers.id })
            .from(farmMembers)
            .where(and(
                eq(farmMembers.farmId, farmId),
                eq(farmMembers.role, 'OWNER'),
                eq(farmMembers.status, 'ACTIVE')
            ))

        return result.length
    }

    async validateMembershipChange(memberId: string, newRole?: string, newStatus?: string): Promise<string[]> {
        const errors: string[] = []

        const member = await this.findById(memberId)
        if (!member) {
            errors.push('Member not found')
            return errors
        }

        // If changing role from OWNER or status to INACTIVE for an OWNER
        const isRemovingOwner = (member.role === 'OWNER' && newRole && newRole !== 'OWNER') ||
            (member.role === 'OWNER' && newStatus === 'INACTIVE')

        if (isRemovingOwner) {
            const ownerCount = await this.countOwners(member.farmId)
            if (ownerCount <= 1) {
                errors.push('Cannot remove the last owner of the farm')
            }
        }

        return errors
    }
}

export const farmMemberRepository = new FarmMemberRepository()