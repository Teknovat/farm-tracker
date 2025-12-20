import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const key = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export interface SessionPayload {
    userId: string
    farmId?: string
    role?: string
    expiresAt: Date
    [key: string]: any
}

export async function encrypt(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
}

export async function createSession(userId: string, farmId?: string, role?: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const session = await encrypt({ userId, farmId, role, expiresAt })

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
        expires: expiresAt,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    })
}

export async function verifySession() {
    const cookieStore = await cookies()
    const cookie = cookieStore.get('session')?.value

    if (!cookie) return null

    try {
        const session = await decrypt(cookie)
        return session
    } catch (error) {
        return null
    }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value
    if (!session) return

    try {
        const parsed = await decrypt(session)
        parsed.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const res = NextResponse.next()
        res.cookies.set({
            name: 'session',
            value: await encrypt(parsed),
            httpOnly: true,
            expires: parsed.expiresAt,
        })
        return res
    } catch (error) {
        return NextResponse.next()
    }
}