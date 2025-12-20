import { BaseRepository } from './base'
import { events } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { eq, and, isNull, desc, asc, gte, lte, inArray } from 'drizzle-orm'
import type { EventPayload } from '@/lib/types'

export interface Event {
    id: string
    farmId: string
    targetType: 'ANIMAL' | 'LOT'
    targetId: string
    eventType: 'BIRTH' | 'VACCINATION' | 'TREATMENT' | 'WEIGHT' | 'SALE' | 'DEATH' | 'NOTE'
    eventDate: Date
    payload: EventPayload
    note?: string
    cost?: number
    nextDueDate?: Date
    attachmentUrl?: string
    createdBy: string
    createdAt: Date
    updatedBy: string
    updatedAt: Date
    deletedAt?: Date | null
}

export interface CreateEventData {
    farmId: string
    targetType: 'ANIMAL' | 'LOT'
    targetId: string
    eventType: 'BIRTH' | 'VACCINATION' | 'TREATMENT' | 'WEIGHT' | 'SALE' | 'DEATH' | 'NOTE'
    eventDate: Date
    payload: EventPayload
    note?: string
    cost?: number
    nextDueDate?: Date
    attachmentUrl?: string
    createdBy: string
}

export interface EventFilters {
    targetId?: string
    eventType?: Event['eventType'] | Event['eventType'][]
    startDate?: Date
    endDate?: Date
    hasNextDueDate?: boolean
    nextDueBefore?: Date
    nextDueAfter?: Date
}

export class EventRepository extends BaseRepository<Event> {
    constructor() {
        super(events)
    }

    /**
     * Find events for a specific target (animal or lot) in chronological order
     */
    async findByTarget(farmId: string, targetId: string, targetType?: 'ANIMAL' | 'LOT'): Promise<Event[]> {
        const conditions = [
            eq(events.farmId, farmId),
            eq(events.targetId, targetId),
            isNull(events.deletedAt)
        ]

        if (targetType) {
            conditions.push(eq(events.targetType, targetType))
        }

        const result = await db
            .select()
            .from(events)
            .where(and(...conditions))
            .orderBy(asc(events.eventDate), asc(events.createdAt))

        return result as Event[]
    }

    /**
     * Find events with filters and pagination
     */
    async findWithFilters(
        farmId: string,
        filters: EventFilters = {},
        limit?: number,
        offset?: number
    ): Promise<Event[]> {
        const conditions = [
            eq(events.farmId, farmId),
            isNull(events.deletedAt)
        ]

        // Apply filters
        if (filters.targetId) {
            conditions.push(eq(events.targetId, filters.targetId))
        }

        if (filters.eventType) {
            if (Array.isArray(filters.eventType)) {
                conditions.push(inArray(events.eventType, filters.eventType))
            } else {
                conditions.push(eq(events.eventType, filters.eventType))
            }
        }

        if (filters.startDate) {
            conditions.push(gte(events.eventDate, filters.startDate))
        }

        if (filters.endDate) {
            conditions.push(lte(events.eventDate, filters.endDate))
        }

        if (filters.hasNextDueDate !== undefined) {
            if (filters.hasNextDueDate) {
                conditions.push(isNull(events.nextDueDate))
            }
        }

        if (filters.nextDueBefore) {
            conditions.push(lte(events.nextDueDate, filters.nextDueBefore))
        }

        if (filters.nextDueAfter) {
            conditions.push(gte(events.nextDueDate, filters.nextDueAfter))
        }

        // Build query with optional limit and offset
        const queryBuilder = db
            .select()
            .from(events)
            .where(and(...conditions))
            .orderBy(desc(events.eventDate), desc(events.createdAt))

        // Apply limit and offset if provided
        const finalQuery = offset
            ? (limit ? queryBuilder.limit(limit).offset(offset) : queryBuilder.offset(offset))
            : (limit ? queryBuilder.limit(limit) : queryBuilder)

        const result = await finalQuery

        return result as Event[]
    }

    /**
     * Find upcoming events (with nextDueDate) within a date range
     */
    async findUpcomingEvents(farmId: string, beforeDate: Date, afterDate?: Date): Promise<Event[]> {
        const conditions = [
            eq(events.farmId, farmId),
            isNull(events.deletedAt),
            lte(events.nextDueDate, beforeDate)
        ]

        if (afterDate) {
            conditions.push(gte(events.nextDueDate, afterDate))
        }

        const result = await db
            .select()
            .from(events)
            .where(and(...conditions))
            .orderBy(asc(events.nextDueDate))

        return result as Event[]
    }

    /**
     * Create a new event with validation
     */
    async create(data: CreateEventData): Promise<Event> {
        // Validate required fields
        if (!data.farmId || !data.targetId || !data.eventType || !data.eventDate || !data.createdBy) {
            throw new Error('Missing required fields: farmId, targetId, eventType, eventDate, and createdBy are required')
        }

        // Validate event type
        const validEventTypes = ['BIRTH', 'VACCINATION', 'TREATMENT', 'WEIGHT', 'SALE', 'DEATH', 'NOTE']
        if (!validEventTypes.includes(data.eventType)) {
            throw new Error(`Invalid event type: ${data.eventType}`)
        }

        // Validate target type
        const validTargetTypes = ['ANIMAL', 'LOT']
        if (!validTargetTypes.includes(data.targetType)) {
            throw new Error(`Invalid target type: ${data.targetType}`)
        }

        // Add updatedBy field (same as createdBy for new records)
        const eventData = {
            ...data,
            updatedBy: data.createdBy
        }

        return await super.create(eventData)
    }

    /**
     * Get event count by type for a farm
     */
    async getEventCountsByType(farmId: string, startDate?: Date, endDate?: Date): Promise<Record<string, number>> {
        const conditions = [
            eq(events.farmId, farmId),
            isNull(events.deletedAt)
        ]

        if (startDate) {
            conditions.push(gte(events.eventDate, startDate))
        }

        if (endDate) {
            conditions.push(lte(events.eventDate, endDate))
        }

        const result = await db
            .select({
                eventType: events.eventType,
                count: events.id
            })
            .from(events)
            .where(and(...conditions))

        // Group by event type and count
        const counts: Record<string, number> = {}
        for (const row of result) {
            counts[row.eventType] = (counts[row.eventType] || 0) + 1
        }

        return counts
    }
}

export const eventRepository = new EventRepository()