import { NextResponse } from 'next/server';

export function middleware(request) {
    // Get the path for logic
    const path = request.nextUrl.pathname;

    // Define public paths that don't satisfy the protection check
    // /api/auth/login needs to be public to generate the token
    // /login is public
    // / is the landing page (public)
    const isPublicPath = path === '/login' || path === '/' || path.startsWith('/api/auth');

    // Check for the access token cookie (HTTP Only or standard)
    const token = request.cookies.get('fyers_access_token')?.value;

    // 1. If trying to access a protected path without a token -> Redirect to Login
    if (!isPublicPath && !token) {
        // Exclude static files (images, standard nextjs chunks) from this check
        if (!path.startsWith('/_next') && !path.startsWith('/favicon.ico') && !path.includes('.')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 2. If trying to access Login page WITH a token -> Redirect to Dashboard
    if (path === '/login' && token) {
        const authCode = request.nextUrl.searchParams.get('auth_code');
        // Only redirect if NOT in the middle of auth callback
        if (!authCode) {
            return NextResponse.redirect(new URL('/home', request.url));
        }
    }

    return NextResponse.next();
}

// Configure which paths the middleware runs on
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
};
