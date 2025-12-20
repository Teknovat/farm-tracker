import { db } from '@/lib/db'
import { animals, events, cashboxMovements, creditExpenses } from '@/lib/db/schema'
import { eq, and, isNull, count, sum, gte, lte, between } from 'drizzle-orm'
import { BaseRepository } from './base'

export interface DashboardStats {
    animals: {
        totalActive: number
        totalSold: number
        totalDead: number
        birthsThisMonth: number
        deathsThisMonth: number
    }
    financial: {
        cashboxBalance: number
        outstandingDebt: number
        expensesThisMonth: number
        expensesByCategory: Record<string, number>
    }
    reminders: {
        urgentCount: number
        upcomingCount: number
    }
}

export interface ReminderEvent {
    id: string
    targetId: string
    targetType: string
    eventType: string
    nextDueDate: Date
    note?: string
    daysUntilDue: number
}

export class DashboardRepository extends BaseRepository<any> {
    constructor() {
        super(null) // Dashboard repository doesn't use a single table
    }
    async getDashboardStats(farmId: string): Promise<DashboardStats> {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        // Animal statistics
        const animalStats = await this.getAnimalStats(farmId, startOfMonth, endOfMonth)

        // Financial statistics
        const financialStats = await this.getFinancialStats(farmId, startOfMonth, endOfMonth)

        // Reminder statistics
        const reminderStats = await this.getReminderStats(farmId)

        return {
            animals: animalStats,
            financial: financialStats,
            reminders: reminderStats
        }
    }

    private async getAnimalStats(farmId: string, startOfMonth: Date, endOfMonth: Date) {
        // Total animals by status
        const animalCounts = await db
            .select({
                status: animals.status,
                count: count()
            })
            .from(animals)
            .where(
                and(
                    eq(animals.farmId, farmId),
                    isNull(animals.deletedAt)
                )
            )
            .groupBy(animals.status)

        let totalActive = 0
        let totalSold = 0
        let totalDead = 0

        animalCounts.forEach(({ status, count: animalCount }) => {
            switch (status) {
                case 'ACTIVE':
                    totalActive = animalCount
                    break
                case 'SOLD':
                    totalSold = animalCount
                    break
                case 'DEAD':
                    totalDead = animalCount
                    break
            }
        })

        // Births this month
        const birthsResult = await db
            .select({ count: count() })
            .from(events)
            .where(
                and(
                    eq(events.farmId, farmId),
                    eq(events.eventType, 'BIRTH'),
                    between(events.eventDate, startOfMonth, endOfMonth),
                    isNull(events.deletedAt)
                )
            )

        // Deaths this month
        const deathsResult = await db
            .select({ count: count() })
            .from(events)
            .where(
                and(
                    eq(events.farmId, farmId),
                    eq(events.eventType, 'DEATH'),
                    between(events.eventDate, startOfMonth, endOfMonth),
                    isNull(events.deletedAt)
                )
            )

        return {
            totalActive,
            totalSold,
            totalDead,
            birthsThisMonth: birthsResult[0]?.count || 0,
            deathsThisMonth: deathsResult[0]?.count || 0
        }
    }

    private async getFinancialStats(farmId: string, startOfMonth: Date, endOfMonth: Date) {
        // Cashbox balance calculation
        const movements = await db
            .select()
            .from(cashboxMovements)
            .where(
                and(
                    eq(cashboxMovements.farmId, farmId),
                    isNull(cashboxMovements.deletedAt)
                )
            )

        let cashboxBalance = 0
        movements.forEach(movement => {
            switch (movement.type) {
                case 'DEPOSIT':
                    cashboxBalance += movement.amount
                    break
                case 'EXPENSE_CASH':
                case 'REIMBURSEMENT':
                    cashboxBalance -= movement.amount
                    break
            }
        })

        // Outstanding debt
        const debtResult = await db
            .select({ total: sum(creditExpenses.remainingAmount) })
            .from(creditExpenses)
            .where(
                and(
                    eq(creditExpenses.farmId, farmId),
                    isNull(creditExpenses.deletedAt)
                )
            )

        const outstandingDebt = debtResult[0]?.total
        const outstandingDebtNumber = typeof outstandingDebt === 'string' ? parseFloat(outstandingDebt) : (outstandingDebt || 0)

        // Expenses this month
        const expensesThisMonth = await db
            .select({
                category: cashboxMovements.category,
                total: sum(cashboxMovements.amount)
            })
            .from(cashboxMovements)
            .where(
                and(
                    eq(cashboxMovements.farmId, farmId),
                    between(cashboxMovements.createdAt, startOfMonth, endOfMonth),
                    isNull(cashboxMovements.deletedAt)
                )
            )
            .groupBy(cashboxMovements.category)

        const expensesByCategory: Record<string, number> = {}
        let totalExpensesThisMonth = 0

        expensesThisMonth.forEach(({ category, total }) => {
            if (category) {
                const totalNumber = typeof total === 'string' ? parseFloat(total) : (total || 0)
                expensesByCategory[category] = totalNumber
                totalExpensesThisMonth += totalNumber
            }
        })

        return {
            cashboxBalance,
            outstandingDebt: outstandingDebtNumber,
            expensesThisMonth: totalExpensesThisMonth,
            expensesByCategory
        }
    }

    private async getReminderStats(farmId: string) {
        const now = new Date()
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(now.getDate() + 7)

        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(now.getDate() + 30)

        // Urgent reminders (within 7 days)
        const urgentResult = await db
            .select({ count: count() })
            .from(events)
            .where(
                and(
                    eq(events.farmId, farmId),
                    lte(events.nextDueDate, sevenDaysFromNow),
                    gte(events.nextDueDate, now),
                    isNull(events.deletedAt)
                )
            )

        // Upcoming reminders (within 30 days but not urgent)
        const upcomingResult = await db
            .select({ count: count() })
            .from(events)
            .where(
                and(
                    eq(events.farmId, farmId),
                    lte(events.nextDueDate, thirtyDaysFromNow),
                    gte(events.nextDueDate, sevenDaysFromNow),
                    isNull(events.deletedAt)
                )
            )

        return {
            urgentCount: urgentResult[0]?.count || 0,
            upcomingCount: upcomingResult[0]?.count || 0
        }
    }

    async getReminders(farmId: string, daysAhead: number = 30): Promise<ReminderEvent[]> {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(now.getDate() + daysAhead)

        const reminders = await db
            .select()
            .from(events)
            .where(
                and(
                    eq(events.farmId, farmId),
                    lte(events.nextDueDate, futureDate),
                    gte(events.nextDueDate, now),
                    isNull(events.deletedAt)
                )
            )
            .orderBy(events.nextDueDate)

        return reminders.map(event => {
            const daysUntilDue = Math.ceil(
                (event.nextDueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )

            return {
                id: event.id,
                targetId: event.targetId,
                targetType: event.targetType,
                eventType: event.eventType,
                nextDueDate: event.nextDueDate!,
                note: event.note || undefined,
                daysUntilDue
            }
        })
    }
}

export const dashboardRepository = new DashboardRepository()