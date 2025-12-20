import { db } from '@/lib/db'
import { eq, and, isNull } from 'drizzle-orm'

export abstract class BaseRepository<T extends Record<string, any>> {
    protected table: any

    constructor(table: any) {
        this.table = table
    }

    async findById(id: string): Promise<T | null> {
        const conditions = [eq(this.table.id, id)]

        // Only add deletedAt check if the table has that column
        if (this.table.deletedAt) {
            conditions.push(isNull(this.table.deletedAt))
        }

        const result = await db
            .select()
            .from(this.table)
            .where(and(...conditions))
            .limit(1)

        return result[0] as T || null
    }

    async findAll(farmId?: string): Promise<T[]> {
        const conditions = []

        // Only add deletedAt check if the table has that column
        if (this.table.deletedAt) {
            conditions.push(isNull(this.table.deletedAt))
        }

        if (farmId && this.table.farmId) {
            conditions.push(eq(this.table.farmId, farmId))
        }

        const result = await db
            .select()
            .from(this.table)
            .where(conditions.length > 0 ? and(...conditions) : undefined)

        return result as T[]
    }

    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<T> {
        const id = crypto.randomUUID()
        const now = new Date()

        const insertData = {
            ...data,
            id,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }

        // If updatedBy is not provided but createdBy is, use createdBy as updatedBy
        if ('createdBy' in insertData && !('updatedBy' in insertData)) {
            (insertData as any).updatedBy = (insertData as any).createdBy
        }

        await db.insert(this.table).values(insertData)

        const created = await this.findById(id)
        if (!created) {
            throw new Error('Failed to create record')
        }

        return created
    }

    async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T | null> {
        const updateData = {
            ...data,
            updatedAt: new Date(),
        }

        const conditions = [eq(this.table.id, id)]

        // Only add deletedAt check if the table has that column
        if (this.table.deletedAt) {
            conditions.push(isNull(this.table.deletedAt))
        }

        await db
            .update(this.table)
            .set(updateData)
            .where(and(...conditions))

        return await this.findById(id)
    }

    async softDelete(id: string): Promise<boolean> {
        // Only perform soft delete if the table has deletedAt column
        if (!this.table.deletedAt) {
            return await this.hardDelete(id)
        }

        const conditions = [eq(this.table.id, id)]

        // Only add deletedAt check if the table has that column
        if (this.table.deletedAt) {
            conditions.push(isNull(this.table.deletedAt))
        }

        const result = await db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(and(...conditions))

        return result.changes > 0
    }

    async hardDelete(id: string): Promise<boolean> {
        const result = await db
            .delete(this.table)
            .where(eq(this.table.id, id))

        return result.changes > 0
    }
}