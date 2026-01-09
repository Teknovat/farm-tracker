import { NextRequest, NextResponse } from 'next/server'
import { eventRepository } from '@/lib/repositories/event'
import { animalRepository } from '@/lib/repositories/animal'
import { cashboxRepository } from '@/lib/repositories/cashbox'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import type { ApiResponse } from '@/lib/types'
import type { CreateEventData, EventFilters } from '@/lib/repositories/event'

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

        // Check farm access
        const hasAccess = await checkFarmAccess(user.id, farmId, 'READ')
        if (!hasAccess) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        // Parse query parameters for filtering
        const { searchParams } = new URL(request.url)
        const filters: EventFilters = {}

        if (searchParams.get('targetId')) {
            filters.targetId = searchParams.get('targetId')!
        }

        if (searchParams.get('eventType')) {
            const eventTypes = searchParams.get('eventType')!.split(',')
            filters.eventType = eventTypes.length === 1 ? eventTypes[0] as any : eventTypes as any
        }

        if (searchParams.get('startDate')) {
            filters.startDate = new Date(searchParams.get('startDate')!)
        }

        if (searchParams.get('endDate')) {
            filters.endDate = new Date(searchParams.get('endDate')!)
        }

        if (searchParams.get('hasNextDueDate')) {
            filters.hasNextDueDate = searchParams.get('hasNextDueDate') === 'true'
        }

        if (searchParams.get('nextDueBefore')) {
            filters.nextDueBefore = new Date(searchParams.get('nextDueBefore')!)
        }

        if (searchParams.get('nextDueAfter')) {
            filters.nextDueAfter = new Date(searchParams.get('nextDueAfter')!)
        }

        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

        const events = await eventRepository.findWithFilters(farmId, filters, limit, offset)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: events
        })

    } catch (error) {
        console.error('Error fetching events:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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

        // Validate required fields
        if (!body.targetId || !body.targetType || !body.eventType || !body.eventDate) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Missing required fields: targetId, targetType, eventType, and eventDate are required' },
                { status: 400 }
            )
        }

        // Verify the target (animal/lot) exists and belongs to this farm
        const target = await animalRepository.findById(body.targetId)
        if (!target || target.farmId !== farmId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Target animal/lot not found or does not belong to this farm' },
                { status: 404 }
            )
        }

        // Validate target type matches the animal type
        const expectedTargetType = target.type === 'INDIVIDUAL' ? 'ANIMAL' : 'LOT'
        if (body.targetType !== expectedTargetType) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: `Target type mismatch: expected ${expectedTargetType} for this ${target.type}` },
                { status: 400 }
            )
        }

        // Prepare event data
        const eventData: CreateEventData = {
            farmId: farmId,
            targetId: body.targetId,
            targetType: body.targetType,
            eventType: body.eventType,
            eventDate: new Date(body.eventDate),
            payload: body.payload || {},
            createdBy: user.id
        }

        // Add optional fields if provided
        if (body.note) eventData.note = body.note
        if (body.cost !== undefined) eventData.cost = parseFloat(body.cost)
        if (body.nextDueDate) eventData.nextDueDate = new Date(body.nextDueDate)
        if (body.attachmentUrl) eventData.attachmentUrl = body.attachmentUrl

        const event = await eventRepository.create(eventData)

        // If event has a cost, automatically deduct it from cashbox
        if (event.cost && event.cost > 0) {
            try {
                // Map event types to expense categories
                const eventTypeToCategory = {
                    'VACCINATION': 'VET',
                    'TREATMENT': 'VET',
                    'FEED': 'FEED',
                    'SALE': 'OTHER', // Sales shouldn't normally have expenses, but just in case
                    'BIRTH': 'VET',
                    'WEIGHT': 'EQUIPMENT',
                    'DEATH': 'VET',
                    'NOTE': 'OTHER'
                } as const;

                // Use provided category from body, or map from event type, or default to OTHER
                const category = body.category ||
                                eventTypeToCategory[body.eventType as keyof typeof eventTypeToCategory] ||
                                'OTHER';

                // Generate descriptive text for the expense
                const getEventTypeDescription = (eventType: string) => {
                    const descriptions = {
                        'VACCINATION': 'Vaccination',
                        'TREATMENT': 'Traitement médical',
                        'FEED': 'Alimentation',
                        'SALE': 'Frais de vente',
                        'BIRTH': 'Frais de naissance',
                        'WEIGHT': 'Pesée',
                        'DEATH': 'Frais vétérinaires',
                        'NOTE': 'Autre dépense'
                    };
                    return descriptions[eventType as keyof typeof descriptions] || eventType;
                };

                const animalIdentifier = target.tagNumber || `${target.species} #${target.id.slice(0, 8)}`;
                const eventDescription = getEventTypeDescription(event.eventType);
                const description = event.note
                    ? `${eventDescription}: ${event.note} (${animalIdentifier})`
                    : `${eventDescription} - ${animalIdentifier}`;

                // Create cash expense in cashbox
                await cashboxRepository.createCashExpense({
                    farmId: farmId,
                    amount: event.cost,
                    description: description,
                    category: category as any,
                    createdBy: user.id
                });
            } catch (cashboxError) {
                console.error('Error creating cashbox expense for event:', cashboxError);
                // Note: We don't fail the event creation if cashbox update fails
                // This ensures the event is still recorded even if there are cashbox issues
            }
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: event,
            message: 'Event created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating event:', error)

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