
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRateLimited } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  // Use IP address as the default identifier for rate limiting.
  const identifier = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  let limitType: 'ip' | 'user' = 'ip';

  // Check for session cookie to determine if user is logged in.
  // Note: We are NOT verifying the cookie here to avoid using firebase-admin in the Edge runtime.
  // Actual auth verification should happen in server components or API routes.
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    // If a cookie exists, we can *assume* it's a user and apply a user-based rate limit.
    // The identifier for rate limiting in this case could be a hash of the cookie or still the IP.
    // For simplicity, we'll still use the IP but apply a user-level limit.
    limitType = 'user';
  }

  // Check if the identifier is rate-limited.
  if (isRateLimited(identifier, limitType)) {
    // If rate-limited, return a 429 response.
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // If not rate-limited, allow the request to proceed.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
