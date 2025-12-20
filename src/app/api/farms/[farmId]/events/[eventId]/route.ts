import { NextRequest, NextResponse } from 'next/server'
import { eventRepository } from '@/lib/repositories/event'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import type { ApiResponse } from '@/lib/types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; eventId: string }> }
) {
    const { farmId, eventId } = await params
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

        const event = await eventRepository.findById(eventId)
        if (!event || event.farmId !== farmId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Event not found' },
                { status: 404 }
            )
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: event
        })

    } catch (error) {
        console.error('Error fetching event:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; eventId: string }> }
) {
    const { farmId, eventId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check farm access - need UPDATE permission
        const hasAccess = await checkFarmAccess(user.id, farmId, 'UPDATE')
        if (!hasAccess) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        // Verify event exists and belongs to this farm
        const existingEvent = await eventRepository.findById(eventId)
        if (!existingEvent || existingEvent.farmId !== farmId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Event not found' },
                { status: 404 }
            )
        }

        const body = await request.json()

        // Prepare update data
        const updateData: any = {
            updatedBy: user.id
        }

        // Update allowed fields
        if (body.eventDate) updateData.eventDate = new Date(body.eventDate)
        if (body.payload !== undefined) updateData.payload = body.payload
        if (body.note !== undefined) updateData.note = body.note
        if (body.cost !== undefined) updateData.cost = body.cost ? parseFloat(body.cost) : null
        if (body.nextDueDate !== undefined) {
            updateData.nextDueDate = body.nextDueDate ? new Date(body.nextDueDate) : null
        }
        if (body.attachmentUrl !== undefined) updateData.attachmentUrl = body.attachmentUrl

        // Validate event type if provided
        if (body.eventType) {
            const validEventTypes = ['BIRTH', 'VACCINATION', 'TREATMENT', 'WEIGHT', 'SALE', 'DEATH', 'NOTE']
            if (!validEventTypes.includes(body.eventType)) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: `Invalid event type: ${body.eventType}` },
                    { status: 400 }
                )
            }
            updateData.eventType = body.eventType
        }

        const updatedEvent = await eventRepository.update(eventId, updateData)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: updatedEvent,
            message: 'Event updated successfully'
        })

    } catch (error) {
        console.error('Error updating event:', error)

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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; eventId: string }> }
) {
    const { farmId, eventId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check farm access - need DELETE permission
        const hasAccess = await checkFarmAccess(user.id, farmId, 'DELETE')
        if (!hasAccess) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        // Verify event exists and belongs to this farm
        const existingEvent = await eventRepository.findById(eventId)
        if (!existingEvent || existingEvent.farmId !== farmId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Event not found' },
                { status: 404 }
            )
        }

        const deleted = await eventRepository.softDelete(eventId)
        if (!deleted) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Failed to delete event' },
                { status: 500 }
            )
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Event deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting event:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}