import { BusinessLogicError } from './error-handler'
import { AnimalRepository } from '@/lib/repositories/animal'
import { EventRepository } from '@/lib/repositories/event'
import { CashboxRepository } from '@/lib/repositories/cashbox'
import { FarmRepository } from '@/lib/repositories/farm'

const animalRepository = new AnimalRepository()
const eventRepository = new EventRepository()
const cashboxRepository = new CashboxRepository()
const farmRepository = new FarmRepository()

// Business logic validation functions

/**
 * Validates animal state transitions
 */
export async function validateAnimalStatusTransition(
    animalId: string,
    currentStatus: string,
    newStatus: string
): Promise<void> {
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
        'ACTIVE': ['SOLD', 'DEAD'],
        'SOLD': [], // Cannot transition from SOLD
        'DEAD': []  // Cannot transition from DEAD
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new BusinessLogicError(
            `Cannot change animal status from ${currentStatus} to ${newStatus}`,
            'INVALID_STATUS_TRANSITION'
        )
    }

    // Additional validation: cannot sell or mark as dead if animal has active events
    if (newStatus === 'SOLD' || newStatus === 'DEAD') {
        const animal = await animalRepository.findById(animalId)
        if (!animal) {
            throw new BusinessLogicError('Animal not found', 'ANIMAL_NOT_FOUND')
        }

        // Find events with future nextDueDate for this animal
        const activeEvents = await eventRepository.findWithFilters(animal.farmId, {
            targetId: animalId,
            nextDueAfter: new Date()
        })

        if (activeEvents.length > 0) {
            throw new BusinessLogicError(
                `Cannot change status to ${newStatus} - animal has ${activeEvents.length} upcoming events`,
                'HAS_ACTIVE_EVENTS'
            )
        }
    }
}

/**
 * Validates animal deletion
 */
export async function validateAnimalDeletion(animalId: string): Promise<void> {
    const animal = await animalRepository.findById(animalId)
    if (!animal) {
        throw new BusinessLogicError('Animal not found', 'ANIMAL_NOT_FOUND')
    }

    // Check if animal has any events
    const events = await eventRepository.findWithFilters(animal.farmId, {
        targetId: animalId
    })

    if (events.length > 0) {
        throw new BusinessLogicError(
            'Cannot delete animal with existing events. Please delete events first or use status change.',
            'HAS_EVENTS'
        )
    }
}

/**
 * Validates event creation business rules
 */
export async function validateEventCreation(eventData: {
    targetId: string
    targetType: 'ANIMAL' | 'LOT'
    eventType: string
    eventDate: Date
    cost?: number
}): Promise<void> {
    // Validate target exists
    const animal = await animalRepository.findById(eventData.targetId)
    if (!animal) {
        throw new BusinessLogicError(
            'Target animal or lot not found',
            'TARGET_NOT_FOUND'
        )
    }

    // Only active animals can receive most events (except DEATH and SALE which mark status changes)
    const statusChangeEvents = ['DEATH', 'SALE']
    if (!statusChangeEvents.includes(eventData.eventType) && animal.status !== 'ACTIVE') {
        throw new BusinessLogicError(
            `Cannot create events for ${animal.status.toLowerCase()} animals`,
            'INACTIVE_TARGET'
        )
    }

    // Validate event date is not in the future for certain event types
    const restrictedFutureEvents = ['BIRTH', 'DEATH', 'SALE', 'WEIGHT']
    if (restrictedFutureEvents.includes(eventData.eventType) && eventData.eventDate > new Date()) {
        throw new BusinessLogicError(
            `${eventData.eventType} events cannot be scheduled in the future`,
            'FUTURE_EVENT_NOT_ALLOWED'
        )
    }

    // Validate death event rules
    if (eventData.eventType === 'DEATH') {
        // Check if animal is already dead
        if (animal.status === 'DEAD') {
            throw new BusinessLogicError(
                'Animal is already marked as dead',
                'ALREADY_DEAD'
            )
        }

        // Check for existing death events
        const existingDeathEvents = await eventRepository.findWithFilters(animal.farmId, {
            targetId: eventData.targetId,
            eventType: 'DEATH'
        })

        if (existingDeathEvents.length > 0) {
            throw new BusinessLogicError(
                'Animal already has a death event recorded',
                'DEATH_EVENT_EXISTS'
            )
        }
    }

    // Validate sale event rules
    if (eventData.eventType === 'SALE') {
        if (animal.status === 'SOLD') {
            throw new BusinessLogicError(
                'Animal is already marked as sold',
                'ALREADY_SOLD'
            )
        }

        if (animal.status === 'DEAD') {
            throw new BusinessLogicError(
                'Cannot sell a dead animal',
                'CANNOT_SELL_DEAD'
            )
        }

        // Validate sale has cost
        if (!eventData.cost || eventData.cost <= 0) {
            throw new BusinessLogicError(
                'Sale events must have a positive cost value',
                'SALE_REQUIRES_COST'
            )
        }
    }

    // Validate birth event rules
    if (eventData.eventType === 'BIRTH') {
        // Birth events should only be for individual animals
        if (animal.type === 'LOT') {
            throw new BusinessLogicError(
                'Birth events are not applicable to lot-type animals',
                'BIRTH_NOT_FOR_LOTS'
            )
        }

        // Check for existing birth events
        const existingBirthEvents = await eventRepository.findWithFilters(animal.farmId, {
            targetId: eventData.targetId,
            eventType: 'BIRTH'
        })

        if (existingBirthEvents.length > 0) {
            throw new BusinessLogicError(
                'Animal already has a birth event recorded',
                'BIRTH_EVENT_EXISTS'
            )
        }
    }
}

/**
 * Validates cashbox operations
 */
export async function validateCashboxOperation(
    farmId: string,
    operationType: 'DEPOSIT' | 'EXPENSE_CASH' | 'REIMBURSEMENT',
    amount: number
): Promise<void> {
    if (amount <= 0) {
        throw new BusinessLogicError(
            'Amount must be positive',
            'INVALID_AMOUNT'
        )
    }

    // For cash expenses and reimbursements, check if there's sufficient balance
    if (operationType === 'EXPENSE_CASH' || operationType === 'REIMBURSEMENT') {
        const balanceData = await cashboxRepository.getCashboxBalance(farmId)

        if (balanceData.balance < amount) {
            throw new BusinessLogicError(
                `Insufficient balance. Current balance: ${balanceData.balance}, requested: ${amount}`,
                'INSUFFICIENT_BALANCE'
            )
        }
    }
}

/**
 * Validates reimbursement operations
 * TODO: Re-enable once credit expense methods are implemented in CashboxRepository
 */
export async function validateReimbursement(
    creditExpenseId: string,
    reimbursementAmount: number
): Promise<void> {
    // TODO: Implement once findCreditExpenseById is added to CashboxRepository
    /*
    const creditExpense = await cashboxRepository.findCreditExpenseById(creditExpenseId)

    if (!creditExpense) {
        throw new BusinessLogicError(
            'Credit expense not found',
            'CREDIT_EXPENSE_NOT_FOUND'
        )
    }

    if (creditExpense.status === 'FULLY_REIMBURSED') {
        throw new BusinessLogicError(
            'Credit expense is already fully reimbursed',
            'ALREADY_REIMBURSED'
        )
    }

    if (reimbursementAmount > creditExpense.remainingAmount) {
        throw new BusinessLogicError(
            `Reimbursement amount (${reimbursementAmount}) exceeds remaining debt (${creditExpense.remainingAmount})`,
            'EXCEEDS_REMAINING_DEBT'
        )
    }
    */

    if (reimbursementAmount <= 0) {
        throw new BusinessLogicError(
            'Reimbursement amount must be positive',
            'INVALID_REIMBURSEMENT_AMOUNT'
        )
    }
}

/**
 * Validates farm member operations
 * TODO: Re-enable once member methods are implemented in FarmRepository
 */
export async function validateFarmMemberOperation(
    farmId: string,
    operation: 'REMOVE_MEMBER' | 'CHANGE_ROLE',
    targetUserId: string,
    newRole?: string
): Promise<void> {
    const farm = await farmRepository.findById(farmId)
    if (!farm) {
        throw new BusinessLogicError(
            'Farm not found',
            'FARM_NOT_FOUND'
        )
    }

    // TODO: Implement once findMembers is added to FarmRepository
    /*
    const members = await farmRepository.findMembers(farmId)
    const owners = members.filter((m: any) => m.role === 'OWNER')
    const targetMember = members.find((m: any) => m.userId === targetUserId)

    if (!targetMember) {
        throw new BusinessLogicError(
            'Member not found in this farm',
            'MEMBER_NOT_FOUND'
        )
    }

    // Prevent removing the last owner
    if (operation === 'REMOVE_MEMBER' && targetMember.role === 'OWNER' && owners.length === 1) {
        throw new BusinessLogicError(
            'Cannot remove the last owner of the farm',
            'LAST_OWNER_REMOVAL'
        )
    }

    // Prevent changing the last owner's role
    if (operation === 'CHANGE_ROLE' && targetMember.role === 'OWNER' && owners.length === 1 && newRole !== 'OWNER') {
        throw new BusinessLogicError(
            'Cannot change the role of the last owner',
            'LAST_OWNER_ROLE_CHANGE'
        )
    }
    */
}

/**
 * Validates lot count operations
 */
export async function validateLotCountOperation(
    animalId: string,
    operation: 'INCREASE' | 'DECREASE',
    count: number
): Promise<void> {
    const animal = await animalRepository.findById(animalId)

    if (!animal) {
        throw new BusinessLogicError(
            'Animal not found',
            'ANIMAL_NOT_FOUND'
        )
    }

    if (animal.type !== 'LOT') {
        throw new BusinessLogicError(
            'Count operations are only valid for lot-type animals',
            'NOT_A_LOT'
        )
    }

    if (operation === 'DECREASE') {
        const currentCount = animal.lotCount || 0
        if (count > currentCount) {
            throw new BusinessLogicError(
                `Cannot decrease count by ${count}. Current count: ${currentCount}`,
                'INSUFFICIENT_LOT_COUNT'
            )
        }

        if (currentCount - count === 0) {
            throw new BusinessLogicError(
                'Cannot reduce lot count to zero. Consider changing animal status instead.',
                'LOT_COUNT_ZERO'
            )
        }
    }
}

/**
 * Validates data export permissions and constraints
 */
export async function validateDataExport(
    farmId: string,
    exportType: 'ANIMALS' | 'EVENTS' | 'FINANCIAL' | 'ALL',
    userRole: string
): Promise<void> {
    // Only owners and associates can export data
    if (userRole === 'WORKER') {
        throw new BusinessLogicError(
            'Workers do not have permission to export data',
            'EXPORT_PERMISSION_DENIED'
        )
    }

    // Financial data export is restricted to owners only
    if ((exportType === 'FINANCIAL' || exportType === 'ALL') && userRole !== 'OWNER') {
        throw new BusinessLogicError(
            'Only farm owners can export financial data',
            'FINANCIAL_EXPORT_RESTRICTED'
        )
    }

    // Check if farm has data to export
    const farm = await farmRepository.findById(farmId)
    if (!farm) {
        throw new BusinessLogicError(
            'Farm not found',
            'FARM_NOT_FOUND'
        )
    }
}