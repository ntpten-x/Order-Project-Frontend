import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:4000'

async function verifySession(request: NextRequest) {
    const cookie = request.headers.get('cookie') || ''
    try {
        const res = await fetch(`${BACKEND_API}/auth/me`, {
            method: 'GET',
            headers: {
                cookie,
                'content-type': 'application/json',
            },
            cache: 'no-store',
        })
        if (!res.ok) return null
        const data = await res.json().catch(() => null)
        return data?.data || data || null
    } catch {
        return null
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

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

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    const token = request.cookies.get('token')?.value

    if (!token) {
        if (!isPublicPath) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return NextResponse.next()
    }

    // Validate session with backend
    const user = await verifySession(request)
    if (!user) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.well-known).*)',
    ],
}
