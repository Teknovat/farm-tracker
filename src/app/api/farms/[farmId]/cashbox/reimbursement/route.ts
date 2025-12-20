import { NextRequest, NextResponse } from 'next/server'
import { cashboxRepository } from '@/lib/repositories/cashbox'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import { validateRequestBody, reimbursementSchema, createValidationResponse } from '@/lib/middleware/validation'
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

        // Validate request body
        const validation = validateRequestBody(reimbursementSchema, body)
        if (!validation.success) {
            return createValidationResponse(validation.errors!)
        }

        const { creditExpenseId, amount, description } = validation.data!

        // Create reimbursement
        const result = await cashboxRepository.createReimbursement({
            farmId,
            creditExpenseId,
            amount,
            description,
            createdBy: user.id
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                movement: result.movement,
                expense: result.expense
            },
            message: 'Reimbursement processed successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error processing reimbursement:', error)

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