import { NextRequest, NextResponse } from 'next/server'
import { cashboxRepository } from '@/lib/repositories/cashbox'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import { validateRequestBody, cashExpenseSchema, creditExpenseSchema, createValidationResponse } from '@/lib/middleware/validation'
import type { ApiResponse } from '@/lib/types'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    const { farmId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check farm access - need CREATE permission
        const hasAccess = await checkFarmAccess(user.id, farmId, 'CREATE')
        if (!hasAccess) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { type } = body

        if (!type || !['CASH', 'CREDIT'].includes(type)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Expense type must be CASH or CREDIT' },
                { status: 400 }
            )
        }

        if (type === 'CASH') {
            // Validate cash expense
            const validation = validateRequestBody(cashExpenseSchema, body)
            if (!validation.success) {
                return createValidationResponse(validation.errors!)
            }

            const { amount, description, category } = validation.data!

            // Create cash expense
            const expense = await cashboxRepository.createCashExpense({
                farmId,
                amount,
                description,
                category,
                createdBy: user.id
            })

            return NextResponse.json<ApiResponse>({
                success: true,
                data: expense,
                message: 'Cash expense recorded successfully'
            }, { status: 201 })

        } else {
            // Validate credit expense
            const validation = validateRequestBody(creditExpenseSchema, body)
            if (!validation.success) {
                return createValidationResponse(validation.errors!)
            }

            const { amount, description, category, paidBy } = validation.data!

            // Create credit expense
            const expense = await cashboxRepository.createCreditExpense({
                farmId,
                amount,
                description,
                category,
                paidBy,
                createdBy: user.id
            })

            return NextResponse.json<ApiResponse>({
                success: true,
                data: expense,
                message: 'Credit expense recorded successfully'
            }, { status: 201 })
        }

    } catch (error) {
        console.error('Error creating expense:', error)

        if (error instanceof Error) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}