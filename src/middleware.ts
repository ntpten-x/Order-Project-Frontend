import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Secret key for JWT signing and verification
// Must match the backend's secret key
const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key"

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

    // 2. Get token from cookies
    const token = request.cookies.get('token')?.value

    // 3. Verify Token and Redirect Logic
    if (!token) {
        // If no token and trying to access protected route -> Redirect to Login
        if (!isPublicPath) {
            // For API routes, return 401 instead of redirecting
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }
    } else {
        // Token exists
        try {
            const secret = new TextEncoder().encode(SECRET_KEY)
            const { payload } = await jwtVerify(token, secret)

            // Extract role from payload
            // Adjust this based on your actual JWT structure. 
            // Previous backend controller showed: { id, username, role: user.roles.roles_name }
            const role = (payload as any).role as string // e.g. "Admin", "Manager", "Employee"

            // If user is logged in and tries to access /login, redirect to dashboard
            if (pathname === '/login') {
                return NextResponse.redirect(new URL('/', request.url))
            }

            // 4. Role-Based Access Control (RBAC) Logic

            // Admin Only Routes
            if (pathname.startsWith('/users') || pathname === '/users') {
                if (role !== 'Admin') {
                    // Unauthorized for this role -> Redirect to dashboard or unauthorized page
                    return NextResponse.redirect(new URL('/', request.url))
                }
            }

            // Ingredient Management (Assuming Admin & Manager, or adjust as needed)
            // If the user request implies only Admin should manage ingredients, use Admin.
            // Backend routes for /ingredients (create/update/delete) are Admin only.
            // So Frontend management pages should probably be Admin only too.
            // Path: /ingredientsUnit/manage
            if (pathname.startsWith('/ingredientsUnit/manage')) {
                // Backend: /ingredientsUnit -> Public-ish (All roles), but maybe "manage" is restrictive?
                // Let's assume Admin only for safety until specified otherwise, or ask user.
                // Given "Safety Audit", strictly implementing Admin-only for management features is safer.
                if (role !== 'Admin') {
                    return NextResponse.redirect(new URL('/ingredientsUnit', request.url))
                }
            }

            // Orders
            // /orders is generally accessible, but maybe specific sub-pages?
            // Leaving /orders open to all authenticated users for now.

        } catch (error) {
            // Token is invalid or expired
            // Redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url))
            response.cookies.delete('token') // Clear invalid token
            return response
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
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
