import { NextRequest, NextResponse } from 'next/server'
import { AnimalRepository } from '@/lib/repositories/animal'
import { eventRepository } from '@/lib/repositories/event'
import { cashboxRepository, type CashboxMovement, type CreditExpense } from '@/lib/repositories/cashbox'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import type { ApiResponse } from '@/lib/types'

export async function GET(
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

        // Check farm access - need READ permission for exports
        const hasAccess = await checkFarmAccess(user.id, farmId, 'READ')
        if (!hasAccess) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'animals', 'events', 'financial'
        const format = searchParams.get('format') || 'csv'

        if (format !== 'csv') {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Only CSV format is supported' },
                { status: 400 }
            )
        }

        let csvData: string
        let filename: string

        switch (type) {
            case 'animals':
                csvData = await generateAnimalsCsv(farmId)
                filename = `animals-${farmId}-${new Date().toISOString().split('T')[0]}.csv`
                break
            case 'events':
                csvData = await generateEventsCsv(farmId)
                filename = `events-${farmId}-${new Date().toISOString().split('T')[0]}.csv`
                break
            case 'financial':
                csvData = await generateFinancialCsv(farmId)
                filename = `financial-${farmId}-${new Date().toISOString().split('T')[0]}.csv`
                break
            default:
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Invalid export type. Must be animals, events, or financial' },
                    { status: 400 }
                )
        }

        return new NextResponse(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error) {
        console.error('Error generating export:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function generateAnimalsCsv(farmId: string): Promise<string> {
    const animalRepo = new AnimalRepository()
    const animals = await animalRepo.findByFarmId(farmId, {})

    const headers = [
        'ID', 'Type', 'Species', 'Sex', 'Birth Date', 'Estimated Age',
        'Status', 'Lot Count', 'Created At', 'Updated At'
    ]

    const rows = animals.map(animal => [
        animal.id,
        animal.type,
        animal.species,
        animal.sex || '',
        animal.birthDate?.toISOString() || '',
        animal.estimatedAge?.toString() || '',
        animal.status,
        animal.lotCount?.toString() || '',
        animal.createdAt.toISOString(),
        animal.updatedAt.toISOString()
    ])

    return generateCsv(headers, rows)
}

async function generateEventsCsv(farmId: string): Promise<string> {
    const events = await eventRepository.findWithFilters(farmId, {})

    const headers = [
        'ID', 'Target ID', 'Target Type', 'Event Type', 'Event Date',
        'Note', 'Cost', 'Next Due Date', 'Created At', 'Updated At'
    ]

    const rows = events.map(event => [
        event.id,
        event.targetId,
        event.targetType,
        event.eventType,
        event.eventDate.toISOString(),
        event.note || '',
        event.cost?.toString() || '',
        event.nextDueDate?.toISOString() || '',
        event.createdAt.toISOString(),
        event.updatedAt.toISOString()
    ])

    return generateCsv(headers, rows)
}

async function generateFinancialCsv(farmId: string): Promise<string> {
    const movements = await cashboxRepository.getRecentMovements(farmId, 1000) // Get all movements
    const creditExpenses = await cashboxRepository.getCreditExpenses(farmId)

    const headers = [
        'ID', 'Type', 'Amount', 'Description', 'Category',
        'Related Expense ID', 'Created At', 'Status', 'Remaining Amount'
    ]

    const rows: string[][] = []

    // Add cashbox movements
    movements.forEach((movement: CashboxMovement) => {
        rows.push([
            movement.id,
            movement.type,
            movement.amount.toString(),
            movement.description,
            movement.category || '',
            movement.relatedExpenseId || '',
            movement.createdAt.toISOString(),
            '', // Status not applicable for movements
            '' // Remaining amount not applicable for movements
        ])
    })

    // Add credit expenses
    creditExpenses.forEach((expense: CreditExpense) => {
        rows.push([
            expense.id,
            'CREDIT_EXPENSE',
            expense.amount.toString(),
            expense.description,
            expense.category,
            '',
            expense.createdAt.toISOString(),
            expense.status,
            expense.remainingAmount.toString()
        ])
    })

    return generateCsv(headers, rows)
}

function generateCsv(headers: string[], rows: string[][]): string {
    const csvRows = [headers, ...rows]
    return csvRows.map(row =>
        row.map(field => `"${field.replace(/"/g, '""')}"`)
            .join(',')
    ).join('\n')
}