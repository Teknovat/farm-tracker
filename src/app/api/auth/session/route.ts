import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { UserRepository } from '@/lib/repositories/user'
import { FarmRepository } from '@/lib/repositories/farm'

export async function GET() {
    try {
        const session = await verifySession()

        if (!session) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        const userRepo = new UserRepository()
        const user = await userRepo.findById(session.userId)

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        let farm = null
        if (session.farmId) {
            const farmRepo = new FarmRepository()
            const farmData = await farmRepo.findById(session.farmId)
            if (farmData) {
                farm = {
                    id: farmData.id,
                    name: farmData.name,
                    role: session.role,
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                farm,
            },
        })
    } catch (error) {
        console.error('Session error:', error)
        return NextResponse.json({ success: false, error: 'Session error' }, { status: 500 })
    }
}