import { db } from '@/lib/db'
import { cashboxMovements, creditExpenses } from '@/lib/db/schema'
import { eq, and, isNull, sum, desc } from 'drizzle-orm'
import { BaseRepository } from './base'

export interface CashboxMovement {
    id: string
    farmId: string
    type: 'DEPOSIT' | 'EXPENSE_CASH' | 'EXPENSE_CREDIT' | 'REIMBURSEMENT'
    amount: number
    description: string
    category?: 'FEED' | 'VET' | 'LABOR' | 'TRANSPORT' | 'EQUIPMENT' | 'UTILITIES' | 'OTHER'
    relatedExpenseId?: string
    createdBy: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
}

export interface CreditExpense {
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

export interface CreateDepositData {
    farmId: string
    amount: number
    description: string
    createdBy: string
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

export class CashboxRepository extends BaseRepository<CashboxMovement> {
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
        const movements = await db
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

        return movements.map(this.mapCashboxMovement)
    }

    async createDeposit(data: CreateDepositData): Promise<CashboxMovement> {
        const movementData = {
            id: crypto.randomUUID(),
            farmId: data.farmId,
            type: 'DEPOSIT' as const,
            amount: data.amount,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const [movement] = await db
            .insert(cashboxMovements)
            .values(movementData)
            .returning()

        return this.mapCashboxMovement(movement)
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

        return this.mapCashboxMovement(movement)
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

        return this.mapCreditExpense(expense)
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

        return {
            movement: this.mapCashboxMovement(movement),
            expense: this.mapCreditExpense(updatedExpense)
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

        const expenses = await db
            .select()
            .from(creditExpenses)
            .where(and(...conditions))
            .orderBy(desc(creditExpenses.createdAt))

        return expenses.map(this.mapCreditExpense)
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

    private mapCashboxMovement(row: any): CashboxMovement {
        return {
            id: row.id,
            farmId: row.farmId,
            type: row.type,
            amount: row.amount,
            description: row.description,
            category: row.category,
            relatedExpenseId: row.relatedExpenseId,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt
        }
    }

    private mapCreditExpense(row: any): CreditExpense {
        return {
            id: row.id,
            farmId: row.farmId,
            amount: row.amount,
            description: row.description,
            category: row.category,
            paidBy: row.paidBy,
            remainingAmount: row.remainingAmount,
            status: row.status,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt
        }
    }
}

export const cashboxRepository = new CashboxRepository()