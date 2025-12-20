import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CashboxRepository } from './cashbox'
import { FarmRepository } from './farm'
import { UserRepository } from './user'
import { db } from '@/lib/db'
import { farms, farmMembers, users, cashboxMovements, creditExpenses } from '@/lib/db/schema'

describe('CashboxRepository', () => {
    let cashboxRepo: CashboxRepository
    let farmRepo: FarmRepository
    let userRepo: UserRepository
    let testUser: any
    let testFarm: any

    beforeEach(async () => {
        cashboxRepo = new CashboxRepository()
        farmRepo = new FarmRepository()
        userRepo = new UserRepository()

        // Create a test user with unique email
        testUser = await userRepo.createUser({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            name: 'Test User',
            passwordHash: 'hashedpassword'
        })

        // Create a test farm
        const farmResult = await farmRepo.createFarmWithOwner({
            name: 'Test Farm',
            createdBy: testUser.id
        })
        testFarm = farmResult.farm
    })

    afterEach(async () => {
        // Clean up test data
        await db.delete(creditExpenses)
        await db.delete(cashboxMovements)
        await db.delete(farmMembers)
        await db.delete(farms)
        await db.delete(users)
    })

    describe('getCashboxBalance', () => {
        it('should return initial balance with zero from farm creation', async () => {
            const balance = await cashboxRepo.getCashboxBalance(testFarm.id)

            expect(balance.balance).toBe(0)
            expect(balance.totalDeposits).toBe(0) // Initial setup deposit is 0
            expect(balance.totalCashExpenses).toBe(0)
            expect(balance.totalReimbursements).toBe(0)
        })
    })

    describe('createDeposit', () => {
        it('should create a deposit and update balance', async () => {
            const depositData = {
                farmId: testFarm.id,
                amount: 100,
                description: 'Test deposit',
                createdBy: testUser.id
            }

            const deposit = await cashboxRepo.createDeposit(depositData)

            expect(deposit.type).toBe('DEPOSIT')
            expect(deposit.amount).toBe(100)
            expect(deposit.description).toBe('Test deposit')

            const balance = await cashboxRepo.getCashboxBalance(testFarm.id)
            expect(balance.balance).toBe(100)
            expect(balance.totalDeposits).toBe(100)
        })
    })

    describe('createCashExpense', () => {
        it('should create a cash expense and decrease balance', async () => {
            // First create a deposit
            await cashboxRepo.createDeposit({
                farmId: testFarm.id,
                amount: 100,
                description: 'Initial deposit',
                createdBy: testUser.id
            })

            const expenseData = {
                farmId: testFarm.id,
                amount: 30,
                description: 'Test expense',
                category: 'FEED' as const,
                createdBy: testUser.id
            }

            const expense = await cashboxRepo.createCashExpense(expenseData)

            expect(expense.type).toBe('EXPENSE_CASH')
            expect(expense.amount).toBe(30)
            expect(expense.category).toBe('FEED')

            const balance = await cashboxRepo.getCashboxBalance(testFarm.id)
            expect(balance.balance).toBe(70) // 100 - 30
        })
    })

    describe('createCreditExpense', () => {
        it('should create a credit expense without affecting cashbox balance', async () => {
            const expenseData = {
                farmId: testFarm.id,
                amount: 50,
                description: 'Test credit expense',
                category: 'VET' as const,
                paidBy: testUser.id,
                createdBy: testUser.id
            }

            const expense = await cashboxRepo.createCreditExpense(expenseData)

            expect(expense.amount).toBe(50)
            expect(expense.remainingAmount).toBe(50)
            expect(expense.status).toBe('OUTSTANDING')

            // Balance should remain 0 (only initial setup deposit)
            const balance = await cashboxRepo.getCashboxBalance(testFarm.id)
            expect(balance.balance).toBe(0)

            // But outstanding debt should be 50
            const debt = await cashboxRepo.getOutstandingDebt(testFarm.id)
            expect(debt).toBe(50)
        })
    })
})