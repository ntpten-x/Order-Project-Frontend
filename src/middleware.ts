import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Define public paths that don't require authentication
    const publicPaths = [
        '/login',
        '/register',
        '/_next',
        '/static',
        '/favicon.ico',
        '/public',
        '/api/auth/login',
        '/api/csrf'
    ]

    // Check if the current path is public
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // 2. Get token from cookies (presence check only to avoid FE/BE secret drift)
    const token = request.cookies.get('token')?.value

    // 3. Redirect Logic without edge-side JWT verify
    if (!token) {
        if (!isPublicPath) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }
    } else {
        // Logged-in users shouldn't see login page
        if (pathname === '/login') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - .well-known (internal/dev-tool paths)
         */
        '/((?!_next/static|_next/image|favicon.ico|.well-known).*)',
    ],
}
