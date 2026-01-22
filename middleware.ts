import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/dashboard/users', '/dashboard/settings'];
  
  // Routes that are public (no auth required)
  const publicRoutes = ['/', '/api/auth/login', '/api/auth/register', '/api/auth/google', '/api/auth/logout'];

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Get the token from cookies
    const token = request.cookies.get('authToken')?.value;
    const role = request.cookies.get('role')?.value;

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Optional: Check role-based access
    if (pathname.startsWith('/dashboard') && !role) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
