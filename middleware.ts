import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth.js v5 with database sessions stores a plain UUID in the session cookie,
// not a JWT/JWE. The JWT-based middleware cannot decode database session tokens.
// We do a lightweight cookie-presence check here; actual session validation
// happens in route handlers via auth() from auth.ts (which can hit the DB).
export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token')

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/library/:path*'],
}
