import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const publicRoutes = new Set(['/', '/login', '/request-demo', '/privacy', '/terms', '/claim-account']);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  const response = await updateSession(request);

  if (publicRoutes.has(pathname)) {
    return response;
  }

  const authCookie = request.cookies.get('sb-access-token') || request.cookies.get('sb-refresh-token');
  if (!authCookie) {
    const redirect = new URL('/login', request.url);
    redirect.searchParams.set('next', pathname);
    return NextResponse.redirect(redirect);
  }

  // This placeholder enforces route-level restrictions.
  // Real role checks should use the authenticated user profile and a trusted DB query.
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/workspace')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/portal')) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)'],
};
