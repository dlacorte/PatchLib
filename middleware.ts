import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The middleware runs as a CloudFront Function which has no access to
// environment variables (AUTH_SECRET). Auth.js JWT decoding therefore
// fails silently. We do a lightweight cookie-presence check here instead.
// Full session validation happens in route handlers via auth() from auth.ts
// (runs in Lambda where env vars are available).
export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get('__Secure-authjs.session-token') ??
    request.cookies.get('authjs.session-token')

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
