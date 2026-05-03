import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only protect /api routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Skip some public routes if any (e.g., status check)
    if (request.nextUrl.pathname === '/api/status' || request.nextUrl.pathname === '/api/recent') {
      return NextResponse.next();
    }

    const apiKey = request.headers.get('x-api-key');
    const adminKey = process.env.ADMIN_API_KEY;

    // In production, require an API key
    if (process.env.NODE_ENV === 'production') {
      if (!adminKey) {
        return NextResponse.json(
          { error: 'Server configuration error: ADMIN_API_KEY missing' },
          { status: 500 }
        );
      }

      if (apiKey !== adminKey) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing X-API-KEY' },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
