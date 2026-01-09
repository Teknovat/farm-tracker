import { db } from '@/lib/db'
import { cashboxMovements, creditExpenses, users } from '@/lib/db/schema'
import { eq, and, isNull, sum, desc, inArray } from 'drizzle-orm'
import { BaseRepository } from './base'

// Base cashbox movement interface (data stored in database)
export interface CashboxMovementDB {
    id: string
    farmId: string
    type: 'DEPOSIT' | 'EXPENSE_CASH' | 'EXPENSE_CREDIT' | 'REIMBURSEMENT'
    amount: number
    description: string
    category?: 'FEED' | 'VET' | 'LABOR' | 'TRANSPORT' | 'EQUIPMENT' | 'UTILITIES' | 'OTHER'
    relatedExpenseId?: string
    paidBy?: string // Who provided/paid the money
    createdBy: string // Who recorded the transaction
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
}

// Cashbox movement interface with user names (for API responses)
export interface CashboxMovement extends CashboxMovementDB {
    createdByName: string
    paidByName?: string // Name of who provided/paid the money
}

// Base credit expense interface (data stored in database)
export interface CreditExpenseDB {
    id: string
    farmId: string
    amount: number
    description: string
    category: 'FEED' | 'VET' | 'LABOR' | 'TRANSPORT' | 'EQUIPMENT' | 'UTILITIES' | 'OTHER'
    paidBy: string
    remainingAmount: number
    status: 'OUTSTANDING' | 'PARTIALLY_REIMBURSED' | 'FULLY_REIMBURSED'
    createdBy: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
}

// Credit expense interface with user names (for API responses)
export interface CreditExpense extends CreditExpenseDB {
    createdByName: string
    paidByName: string
}

export interface CreateDepositData {
    farmId: string
    amount: number
    description: string
    paidBy?: string // Who provided the money (optional, defaults to createdBy)
    createdBy: string // Who recorded the transaction
}

export interface CreateCashExpenseData {
    farmId: string
    amount: number
    description: string
    category: 'FEED' | 'VET' | 'LABOR' | 'TRANSPORT' | 'EQUIPMENT' | 'UTILITIES' | 'OTHER'
    createdBy: string
}

export interface CreateCreditExpenseData {
    farmId: string
    amount: number
    description: string
    category: 'FEED' | 'VET' | 'LABOR' | 'TRANSPORT' | 'EQUIPMENT' | 'UTILITIES' | 'OTHER'
    paidBy: string
    createdBy: string
}

export interface CreateReimbursementData {
    farmId: string
    creditExpenseId: string
    amount: number
    description?: string
    createdBy: string
}

export interface CashboxBalance {
    balance: number
    totalDeposits: number
    totalCashExpenses: number
    totalReimbursements: number
}

export class CashboxRepository extends BaseRepository<CashboxMovementDB> {
    constructor() {
        super(cashboxMovements)
    }
    async getCashboxBalance(farmId: string): Promise<CashboxBalance> {
        const movements = await db
            .select()
            .from(cashboxMovements)
            .where(
                and(
                    eq(cashboxMovements.farmId, farmId),
                    isNull(cashboxMovements.deletedAt)
                )
            )

        let totalDeposits = 0
        let totalCashExpenses = 0
        let totalReimbursements = 0

        movements.forEach(movement => {
            switch (movement.type) {
                case 'DEPOSIT':
                    totalDeposits += movement.amount
                    break
                case 'EXPENSE_CASH':
                    totalCashExpenses += movement.amount
                    break
                case 'REIMBURSEMENT':
                    totalReimbursements += movement.amount
                    break
            }
        })

        const balance = totalDeposits - totalCashExpenses - totalReimbursements

        return {
            balance,
            totalDeposits,
            totalCashExpenses,
            totalReimbursements
        }
    }

    async getRecentMovements(farmId: string, limit: number = 10): Promise<CashboxMovement[]> {
        const movementResults = await db
            .select()
            .from(cashboxMovements)
            .where(
                and(
                    eq(cashboxMovements.farmId, farmId),
                    isNull(cashboxMovements.deletedAt)
                )
            )
            .orderBy(desc(cashboxMovements.createdAt))
            .limit(limit)

        // Get unique user IDs (both createdBy and paidBy)
        const userIds = new Set<string>()
        movementResults.forEach(movement => {
            userIds.add(movement.createdBy)
            if (movement.paidBy) {
                userIds.add(movement.paidBy)
            }
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

        // Combine movement data with user names
        return movementResults.map(movement => ({
            ...movement,
            createdAt: new Date(movement.createdAt),
            updatedAt: new Date(movement.updatedAt),
            deletedAt: movement.deletedAt ? new Date(movement.deletedAt) : undefined,
            createdByName: userMap.get(movement.createdBy) || 'Unknown user',
            paidByName: movement.paidBy ? userMap.get(movement.paidBy) || 'Unknown user' : undefined,
        })) as CashboxMovement[]
    }

    async createDeposit(data: CreateDepositData): Promise<CashboxMovement> {
        const movementData = {
            id: crypto.randomUUID(),
            farmId: data.farmId,
            type: 'DEPOSIT' as const,
            amount: data.amount,
            description: data.description,
            paidBy: data.paidBy || data.createdBy, // Default to createdBy if paidBy not specified
            createdBy: data.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const [movement] = await db
            .insert(cashboxMovements)
            .values(movementData)
            .returning()

        // Get creator name
        const creatorResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, movement.createdBy))
            .limit(1)

        // Get paidBy name
        const paidByResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, movement.paidBy!))
            .limit(1)

        return {
            ...movement,
            createdAt: new Date(movement.createdAt),
            updatedAt: new Date(movement.updatedAt),
            deletedAt: movement.deletedAt ? new Date(movement.deletedAt) : undefined,
            createdByName: creatorResult[0]?.name || 'Unknown user',
            paidByName: paidByResult[0]?.name || 'Unknown user',
        } as CashboxMovement
    }

    async createCashExpense(data: CreateCashExpenseData): Promise<CashboxMovement> {
        const movementData = {
            id: crypto.randomUUID(),
            farmId: data.farmId,
            type: 'EXPENSE_CASH' as const,
            amount: data.amount,
            description: data.description,
            category: data.category,
            createdBy: data.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const [movement] = await db
            .insert(cashboxMovements)
            .values(movementData)
            .returning()

        // Get creator name
        const creatorResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, movement.createdBy))
            .limit(1)

        return {
            ...movement,
            createdAt: new Date(movement.createdAt),
            updatedAt: new Date(movement.updatedAt),
            deletedAt: movement.deletedAt ? new Date(movement.deletedAt) : undefined,
            createdByName: creatorResult[0]?.name || 'Unknown user',
        } as CashboxMovement
    }

    async createCreditExpense(data: CreateCreditExpenseData): Promise<CreditExpense> {
        const expenseData = {
            id: crypto.randomUUID(),
            farmId: data.farmId,
            amount: data.amount,
            description: data.description,
            category: data.category,
            paidBy: data.paidBy,
            remainingAmount: data.amount,
            status: 'OUTSTANDING' as const,
            createdBy: data.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const [expense] = await db
            .insert(creditExpenses)
            .values(expenseData)
            .returning()

        // Also create a cashbox movement record for tracking
        await db.insert(cashboxMovements).values({
            id: crypto.randomUUID(),
            farmId: data.farmId,
            type: 'EXPENSE_CREDIT',
            amount: data.amount,
            description: data.description,
            category: data.category,
            relatedExpenseId: expense.id,
            createdBy: data.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Get user names for both createdBy and paidBy
        const creatorResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, expense.createdBy))
            .limit(1)

        const paidByResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, expense.paidBy))
            .limit(1)

        return {
            ...expense,
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt),
            deletedAt: expense.deletedAt ? new Date(expense.deletedAt) : undefined,
            createdByName: creatorResult[0]?.name || 'Unknown user',
            paidByName: paidByResult[0]?.name || 'Unknown user',
        } as CreditExpense
    }

    async createReimbursement(data: CreateReimbursementData): Promise<{ movement: CashboxMovement; expense: CreditExpense }> {
        // Get the credit expense
        const [expense] = await db
            .select()
            .from(creditExpenses)
            .where(
                and(
                    eq(creditExpenses.id, data.creditExpenseId),
                    eq(creditExpenses.farmId, data.farmId),
                    isNull(creditExpenses.deletedAt)
                )
            )

        if (!expense) {
            throw new Error('Credit expense not found')
        }

        if (data.amount > expense.remainingAmount) {
            throw new Error('Reimbursement amount exceeds remaining debt')
        }

        // Create reimbursement movement
        const movementData = {
            id: crypto.randomUUID(),
            farmId: data.farmId,
            type: 'REIMBURSEMENT' as const,
            amount: data.amount,
            description: data.description || `Reimbursement for: ${expense.description}`,
            relatedExpenseId: expense.id,
            createdBy: data.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const [movement] = await db
            .insert(cashboxMovements)
            .values(movementData)
            .returning()

        // Update credit expense
        const newRemainingAmount = expense.remainingAmount - data.amount
        const newStatus = newRemainingAmount === 0 ? 'FULLY_REIMBURSED' : 'PARTIALLY_REIMBURSED'

        const [updatedExpense] = await db
            .update(creditExpenses)
            .set({
                remainingAmount: newRemainingAmount,
                status: newStatus,
                updatedAt: new Date()
            })
            .where(eq(creditExpenses.id, expense.id))
            .returning()

        // Get user names for the movement
        const movementCreatorResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, movement.createdBy))
            .limit(1)

        // Get user names for the expense (createdBy and paidBy)
        const expenseCreatorResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, updatedExpense.createdBy))
            .limit(1)

        const paidByResult = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, updatedExpense.paidBy))
            .limit(1)

        return {
            movement: {
                ...movement,
                createdAt: new Date(movement.createdAt),
                updatedAt: new Date(movement.updatedAt),
                deletedAt: movement.deletedAt ? new Date(movement.deletedAt) : undefined,
                createdByName: movementCreatorResult[0]?.name || 'Unknown user',
            } as CashboxMovement,
            expense: {
                ...updatedExpense,
                createdAt: new Date(updatedExpense.createdAt),
                updatedAt: new Date(updatedExpense.updatedAt),
                deletedAt: updatedExpense.deletedAt ? new Date(updatedExpense.deletedAt) : undefined,
                createdByName: expenseCreatorResult[0]?.name || 'Unknown user',
                paidByName: paidByResult[0]?.name || 'Unknown user',
            } as CreditExpense
        }
    }

    async getCreditExpenses(farmId: string, status?: string): Promise<CreditExpense[]> {
        const conditions = [
            eq(creditExpenses.farmId, farmId),
            isNull(creditExpenses.deletedAt)
        ]

        if (status) {
            conditions.push(eq(creditExpenses.status, status as any))
        }

        const expenseResults = await db
            .select()
            .from(creditExpenses)
            .where(and(...conditions))
            .orderBy(desc(creditExpenses.createdAt))

        // Get unique user IDs (both createdBy and paidBy)
        const userIds = new Set<string>()
        expenseResults.forEach(expense => {
            userIds.add(expense.createdBy)
            userIds.add(expense.paidBy)
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

        // Combine expense data with user names
        return expenseResults.map(expense => ({
            ...expense,
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt),
            deletedAt: expense.deletedAt ? new Date(expense.deletedAt) : undefined,
            createdByName: userMap.get(expense.createdBy) || 'Unknown user',
            paidByName: userMap.get(expense.paidBy) || 'Unknown user',
        })) as CreditExpense[]
    }

    async getOutstandingDebt(farmId: string): Promise<number> {
        const result = await db
            .select({ total: sum(creditExpenses.remainingAmount) })
            .from(creditExpenses)
            .where(
                and(
                    eq(creditExpenses.farmId, farmId),
                    isNull(creditExpenses.deletedAt)
                )
            )

        const total = result[0]?.total
        return typeof total === 'string' ? parseFloat(total) : (total || 0)
    }

}

export const cashboxRepository = new CashboxRepository()