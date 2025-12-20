export type Role = 'OWNER' | 'ASSOCIATE' | 'WORKER'

export interface Permission {
    canRead: boolean
    canCreate: boolean
    canUpdate: boolean
    canDelete: boolean
    canManageMembers: boolean
    canExport: boolean
}

export function getPermissions(role: Role): Permission {
    switch (role) {
        case 'OWNER':
            return {
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
                canManageMembers: true,
                canExport: true,
            }
        case 'ASSOCIATE':
            return {
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: false,
                canManageMembers: false,
                canExport: true,
            }
        case 'WORKER':
            return {
                canRead: true,
                canCreate: true,
                canUpdate: false,
                canDelete: false,
                canManageMembers: false,
                canExport: false,
            }
        default:
            return {
                canRead: false,
                canCreate: false,
                canUpdate: false,
                canDelete: false,
                canManageMembers: false,
                canExport: false,
            }
    }
}

export function hasPermission(role: Role, action: keyof Permission): boolean {
    const permissions = getPermissions(role)
    return permissions[action]
}

// Helper function to check farm access for API routes
export async function checkFarmAccess(
    userId: string,
    farmId: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<boolean> {
    const { FarmRepository } = await import('@/lib/repositories/farm')
    const farmRepo = new FarmRepository()

    try {
        const member = await farmRepo.findFarmMember(farmId, userId)
        if (!member || member.status !== 'ACTIVE') {
            return false
        }

        const permissions = getPermissions(member.role as Role)

        switch (action) {
            case 'READ':
                return permissions.canRead
            case 'CREATE':
                return permissions.canCreate
            case 'UPDATE':
                return permissions.canUpdate
            case 'DELETE':
                return permissions.canDelete
            default:
                return false
        }
    } catch (error) {
        return false
    }
}