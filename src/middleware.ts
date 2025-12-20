import { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/auth/session'

const locales = ['fr', 'en', 'ar'];

const intlMiddleware = createIntlMiddleware({
    locales,
    defaultLocale: 'fr'
});

export async function middleware(request: NextRequest) {
    // Skip middleware for API routes and static files
    if (
        request.nextUrl.pathname.startsWith('/api/') ||
        request.nextUrl.pathname.startsWith('/_next/') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return await updateSession(request);
    }

    // Handle internationalization first
    const intlResponse = intlMiddleware(request);

    // If intl middleware returns a response (redirect), use it
    if (intlResponse.status !== 200) {
        return intlResponse;
    }

    // Update session for authenticated routes
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}