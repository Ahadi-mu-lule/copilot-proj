import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { refreshSupabaseSession } from '@/lib/supabase/middleware';

const publicRoutes = new Set(['/', '/login', '/request-demo', '/privacy', '/terms', '/claim-account']);

function redirectWithRefreshedCookies(
  destination: URL,
  refreshedResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(destination);
  refreshedResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { response, user } = await refreshSupabaseSession(request);

  if (publicRoutes.has(pathname) || pathname === '/api/health' || pathname.startsWith('/api/')) {
    // API handlers must perform their own authorization and return 401/403 as appropriate.
    return response;
  }

  const isProtectedPage = ['/admin', '/workspace', '/portal'].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedPage && !user) {
    const destination = new URL('/login', request.url);
    // Only use a local relative path; the login action validates it again.
    destination.searchParams.set('next', pathname);
    return redirectWithRefreshedCookies(destination, response);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
