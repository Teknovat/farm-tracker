'use server'

import { revalidatePath } from 'next/cache'
import { FarmRepository } from '@/lib/repositories/farm'
import { AnimalRepository } from '@/lib/repositories/animal'
import { eventRepository } from '@/lib/repositories/event'
import { cashboxRepository } from '@/lib/repositories/cashbox'
import { getServerAuth } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import { validateRequestBody, farmCreateSchema, animalCreateSchema, eventCreateSchema, depositSchema, cashExpenseSchema, creditExpenseSchema } from '@/lib/middleware/validation'

export interface ActionResult {
    success: boolean
    error?: string
    data?: any
}

// Farm Actions
export async function createFarmAction(formData: FormData): Promise<ActionResult> {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return { success: false, error: 'Unauthorized' }
        }

        const data = {
            name: formData.get('name') as string,
            currency: formData.get('currency') as string || 'TND',
            timezone: formData.get('timezone') as string || 'Africa/Tunis'
        }

        const validation = validateRequestBody(farmCreateSchema, data)
        if (!validation.success) {
            return {
                success: false,
                error: validation.errors?.map(e => e.message).join(', ') || 'Validation failed'
            }
        }

        const farmRepo = new FarmRepository()
        const result = await farmRepo.createFarmWithOwner({
            ...validation.data!,
            createdBy: auth.user.id
        })

        revalidatePath('/dashboard')
        return { success: true, data: result }
    } catch (error) {
        console.error('Create farm error:', error)
        return { success: false, error: 'Failed to create farm' }
    }
}

// Animal Actions
export async function createAnimalAction(farmId: string, formData: FormData): Promise<ActionResult> {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return { success: false, error: 'Unauthorized' }
        }

        const hasAccess = await checkFarmAccess(auth.user.id, farmId, 'CREATE')
        if (!hasAccess) {
            return { success: false, error: 'Access denied' }
        }

        const data = {
            type: formData.get('type') as string,
            species: formData.get('species') as string,
            sex: formData.get('sex') as string || undefined,
            birthDate: formData.get('birthDate') as string || undefined,
            estimatedAge: formData.get('estimatedAge') ? parseInt(formData.get('estimatedAge') as string) : undefined,
            status: formData.get('status') as string || 'ACTIVE',
            photoUrl: formData.get('photoUrl') as string || undefined,
            lotCount: formData.get('lotCount') ? parseInt(formData.get('lotCount') as string) : undefined
        }

        const validation = validateRequestBody(animalCreateSchema, data)
        if (!validation.success) {
            return {
                success: false,
                error: validation.errors?.map(e => e.message).join(', ') || 'Validation failed'
            }
        }

        const animalRepo = new AnimalRepository()
        const validatedData = validation.data!
        const animal = await animalRepo.create({
            farmId,
            type: validatedData.type,
            species: validatedData.species,
            sex: validatedData.sex,
            birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined,
            estimatedAge: validatedData.estimatedAge,
            status: validatedData.status,
            photoUrl: validatedData.photoUrl,
            lotCount: validatedData.lotCount,
            createdBy: auth.user.id
        })

        revalidatePath(`/farms/${farmId}/animals`)
        return { success: true, data: animal }
    } catch (error) {
        console.error('Create animal error:', error)
        return { success: false, error: 'Failed to create animal' }
    }
}

// Event Actions
export async function createEventAction(farmId: string, formData: FormData): Promise<ActionResult> {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return { success: false, error: 'Unauthorized' }
        }

        const hasAccess = await checkFarmAccess(auth.user.id, farmId, 'CREATE')
        if (!hasAccess) {
            return { success: false, error: 'Access denied' }
        }

        const data = {
            targetId: formData.get('targetId') as string,
            targetType: formData.get('targetType') as string,
            eventType: formData.get('eventType') as string,
            eventDate: formData.get('eventDate') as string,
            payload: JSON.parse(formData.get('payload') as string || '{}'),
            note: formData.get('note') as string || undefined,
            cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : undefined,
            nextDueDate: formData.get('nextDueDate') as string || undefined,
            attachmentUrl: formData.get('attachmentUrl') as string || undefined
        }

        const validation = validateRequestBody(eventCreateSchema, data)
        if (!validation.success) {
            return {
                success: false,
                error: validation.errors?.map(e => e.message).join(', ') || 'Validation failed'
            }
        }

        const validatedData = validation.data!
        const event = await eventRepository.create({
            farmId,
            targetId: validatedData.targetId,
            targetType: validatedData.targetType,
            eventType: validatedData.eventType,
            eventDate: new Date(validatedData.eventDate),
            payload: validatedData.payload || {},
            note: validatedData.note,
            cost: validatedData.cost,
            nextDueDate: validatedData.nextDueDate ? new Date(validatedData.nextDueDate) : undefined,
            attachmentUrl: validatedData.attachmentUrl,
            createdBy: auth.user.id
        })

        revalidatePath(`/farms/${farmId}/events`)
        revalidatePath(`/farms/${farmId}/animals/${data.targetId}`)
        return { success: true, data: event }
    } catch (error) {
        console.error('Create event error:', error)
        return { success: false, error: 'Failed to create event' }
    }
}

// Cashbox Actions
export async function createDepositAction(farmId: string, formData: FormData): Promise<ActionResult> {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return { success: false, error: 'Unauthorized' }
        }

        const hasAccess = await checkFarmAccess(auth.user.id, farmId, 'CREATE')
        if (!hasAccess) {
            return { success: false, error: 'Access denied' }
        }

        const data = {
            amount: parseFloat(formData.get('amount') as string),
            description: formData.get('description') as string
        }

        const validation = validateRequestBody(depositSchema, data)
        if (!validation.success) {
            return {
                success: false,
                error: validation.errors?.map(e => e.message).join(', ') || 'Validation failed'
            }
        }

        const deposit = await cashboxRepository.createDeposit({
            farmId,
            ...validation.data!,
            createdBy: auth.user.id
        })

        revalidatePath(`/farms/${farmId}/cashbox`)
        revalidatePath(`/farms/${farmId}/dashboard`)
        return { success: true, data: deposit }
    } catch (error) {
        console.error('Create deposit error:', error)
        return { success: false, error: 'Failed to create deposit' }
    }
}

export async function createCashExpenseAction(farmId: string, formData: FormData): Promise<ActionResult> {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return { success: false, error: 'Unauthorized' }
        }

        const hasAccess = await checkFarmAccess(auth.user.id, farmId, 'CREATE')
        if (!hasAccess) {
            return { success: false, error: 'Access denied' }
        }

        const data = {
            amount: parseFloat(formData.get('amount') as string),
            description: formData.get('description') as string,
            category: formData.get('category') as string
        }

        const validation = validateRequestBody(cashExpenseSchema, data)
        if (!validation.success) {
            return {
                success: false,
                error: validation.errors?.map(e => e.message).join(', ') || 'Validation failed'
            }
        }

        const expense = await cashboxRepository.createCashExpense({
            farmId,
            ...validation.data!,
            createdBy: auth.user.id
        })

        revalidatePath(`/farms/${farmId}/cashbox`)
        revalidatePath(`/farms/${farmId}/dashboard`)
        return { success: true, data: expense }
    } catch (error) {
        console.error('Create cash expense error:', error)
        return { success: false, error: 'Failed to create cash expense' }
    }
}

export async function createCreditExpenseAction(farmId: string, formData: FormData): Promise<ActionResult> {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return { success: false, error: 'Unauthorized' }
        }

        const hasAccess = await checkFarmAccess(auth.user.id, farmId, 'CREATE')
        if (!hasAccess) {
            return { success: false, error: 'Access denied' }
        }

        const data = {
            amount: parseFloat(formData.get('amount') as string),
            description: formData.get('description') as string,
            category: formData.get('category') as string,
            paidBy: formData.get('paidBy') as string
        }

        const validation = validateRequestBody(creditExpenseSchema, data)
        if (!validation.success) {
            return {
                success: false,
                error: validation.errors?.map(e => e.message).join(', ') || 'Validation failed'
            }
        }

        const expense = await cashboxRepository.createCreditExpense({
            farmId,
            ...validation.data!,
            createdBy: auth.user.id
        })

        revalidatePath(`/farms/${farmId}/cashbox`)
        revalidatePath(`/farms/${farmId}/dashboard`)
        return { success: true, data: expense }
    } catch (error) {
        console.error('Create credit expense error:', error)
        return { success: false, error: 'Failed to create credit expense' }
    }
}