import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

export interface User {
    id: string
    email: string
    name: string
    passwordHash: string
    createdAt: Date
    updatedAt: Date
}

export class UserRepository {
    async findById(id: string): Promise<User | null> {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1)

        return result[0] as User || null
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        return result[0] as User || null
    }

    async createUser(data: {
        email: string
        name: string
        passwordHash: string
    }): Promise<User> {
        const id = crypto.randomUUID()
        const now = new Date()

        const insertData = {
            ...data,
            id,
            createdAt: now,
            updatedAt: now,
        }

        await db.insert(users).values(insertData)

        const created = await this.findById(id)
        if (!created) {
            throw new Error('Failed to create user')
        }

        return created
    }

    async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
        const updateData = {
            ...data,
            updatedAt: new Date(),
        }

        await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))

        return await this.findById(id)
    }

    async delete(id: string): Promise<boolean> {
        const result = await db
            .delete(users)
            .where(eq(users.id, id))

        return result.changes > 0
    }
}