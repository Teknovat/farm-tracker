import { db } from '@/lib/db'
import { farmInvitations, farms, users } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export interface FarmInvitation {
    id: string
    farmId: string
    email: string
    role: 'OWNER' | 'ASSOCIATE' | 'WORKER'
    token: string
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
    expiresAt: Date
    invitedBy: string
    createdAt: Date
    acceptedAt?: Date
    // Joined data
    farmName: string
    inviterName: string
}

export interface CreateInvitationData {
    farmId: string
    email: string
    role: 'OWNER' | 'ASSOCIATE' | 'WORKER'
    invitedBy: string
}

export class FarmInvitationRepository {
    private generateToken(): string {
        return crypto.randomUUID() + '-' + Date.now().toString(36)
    }

    async create(data: CreateInvitationData): Promise<FarmInvitation> {
        const id = crypto.randomUUID()
        const token = this.generateToken()
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

        await db.insert(farmInvitations).values({
            id,
            farmId: data.farmId,
            email: data.email,
            role: data.role,
            token,
            status: 'PENDING',
            expiresAt,
            invitedBy: data.invitedBy,
            createdAt: now,
        })

        const created = await this.findById(id)
        if (!created) {
            throw new Error('Failed to create invitation')
        }

        return created
    }

    async findById(id: string): Promise<FarmInvitation | null> {
        const result = await db
            .select({
                id: farmInvitations.id,
                farmId: farmInvitations.farmId,
                email: farmInvitations.email,
                role: farmInvitations.role,
                token: farmInvitations.token,
                status: farmInvitations.status,
                expiresAt: farmInvitations.expiresAt,
                invitedBy: farmInvitations.invitedBy,
                createdAt: farmInvitations.createdAt,
                acceptedAt: farmInvitations.acceptedAt,
                farmName: farms.name,
                inviterName: users.name,
            })
            .from(farmInvitations)
            .innerJoin(farms, eq(farmInvitations.farmId, farms.id))
            .innerJoin(users, eq(farmInvitations.invitedBy, users.id))
            .where(eq(farmInvitations.id, id))
            .limit(1)

        if (result.length === 0) {
            return null
        }

        const row = result[0]
        return {
            ...row,
            expiresAt: new Date(row.expiresAt),
            createdAt: new Date(row.createdAt),
            acceptedAt: row.acceptedAt ? new Date(row.acceptedAt) : undefined,
        }
    }

    async findByToken(token: string): Promise<FarmInvitation | null> {
        const result = await db
            .select({
                id: farmInvitations.id,
                farmId: farmInvitations.farmId,
                email: farmInvitations.email,
                role: farmInvitations.role,
                token: farmInvitations.token,
                status: farmInvitations.status,
                expiresAt: farmInvitations.expiresAt,
                invitedBy: farmInvitations.invitedBy,
                createdAt: farmInvitations.createdAt,
                acceptedAt: farmInvitations.acceptedAt,
                farmName: farms.name,
                inviterName: users.name,
            })
            .from(farmInvitations)
            .innerJoin(farms, eq(farmInvitations.farmId, farms.id))
            .innerJoin(users, eq(farmInvitations.invitedBy, users.id))
            .where(eq(farmInvitations.token, token))
            .limit(1)

        if (result.length === 0) {
            return null
        }

        const row = result[0]
        return {
            ...row,
            expiresAt: new Date(row.expiresAt),
            createdAt: new Date(row.createdAt),
            acceptedAt: row.acceptedAt ? new Date(row.acceptedAt) : undefined,
        }
    }

    async findByFarmId(farmId: string): Promise<FarmInvitation[]> {
        const result = await db
            .select({
                id: farmInvitations.id,
                farmId: farmInvitations.farmId,
                email: farmInvitations.email,
                role: farmInvitations.role,
                token: farmInvitations.token,
                status: farmInvitations.status,
                expiresAt: farmInvitations.expiresAt,
                invitedBy: farmInvitations.invitedBy,
                createdAt: farmInvitations.createdAt,
                acceptedAt: farmInvitations.acceptedAt,
                farmName: farms.name,
                inviterName: users.name,
            })
            .from(farmInvitations)
            .innerJoin(farms, eq(farmInvitations.farmId, farms.id))
            .innerJoin(users, eq(farmInvitations.invitedBy, users.id))
            .where(eq(farmInvitations.farmId, farmId))
            .orderBy(farmInvitations.createdAt)

        return result.map(row => ({
            ...row,
            expiresAt: new Date(row.expiresAt),
            createdAt: new Date(row.createdAt),
            acceptedAt: row.acceptedAt ? new Date(row.acceptedAt) : undefined,
        }))
    }

    async findPendingByEmail(email: string, farmId: string): Promise<FarmInvitation | null> {
        const result = await db
            .select({
                id: farmInvitations.id,
                farmId: farmInvitations.farmId,
                email: farmInvitations.email,
                role: farmInvitations.role,
                token: farmInvitations.token,
                status: farmInvitations.status,
                expiresAt: farmInvitations.expiresAt,
                invitedBy: farmInvitations.invitedBy,
                createdAt: farmInvitations.createdAt,
                acceptedAt: farmInvitations.acceptedAt,
                farmName: farms.name,
                inviterName: users.name,
            })
            .from(farmInvitations)
            .innerJoin(farms, eq(farmInvitations.farmId, farms.id))
            .innerJoin(users, eq(farmInvitations.invitedBy, users.id))
            .where(and(
                eq(farmInvitations.email, email),
                eq(farmInvitations.farmId, farmId),
                eq(farmInvitations.status, 'PENDING')
            ))
            .limit(1)

        if (result.length === 0) {
            return null
        }

        const row = result[0]
        return {
            ...row,
            expiresAt: new Date(row.expiresAt),
            createdAt: new Date(row.createdAt),
            acceptedAt: row.acceptedAt ? new Date(row.acceptedAt) : undefined,
        }
    }

    async accept(token: string): Promise<FarmInvitation> {
        const now = new Date()

        await db
            .update(farmInvitations)
            .set({
                status: 'ACCEPTED',
                acceptedAt: now,
            })
            .where(eq(farmInvitations.token, token))

        const updated = await this.findByToken(token)
        if (!updated) {
            throw new Error('Invitation not found after acceptance')
        }

        return updated
    }

    async expire(id: string): Promise<void> {
        await db
            .update(farmInvitations)
            .set({
                status: 'EXPIRED',
            })
            .where(eq(farmInvitations.id, id))
    }

    async expireOldInvitations(): Promise<number> {
        const now = new Date()

        const result = await db
            .update(farmInvitations)
            .set({
                status: 'EXPIRED',
            })
            .where(and(
                eq(farmInvitations.status, 'PENDING'),
                lt(farmInvitations.expiresAt, now)
            ))

        return result.rowsAffected || 0
    }

    async delete(id: string): Promise<void> {
        await db
            .delete(farmInvitations)
            .where(eq(farmInvitations.id, id))
    }
}

export const farmInvitationRepository = new FarmInvitationRepository()