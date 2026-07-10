import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

// Gate the dashboard behind a session cookie. Unauthenticated requests are
// redirected to the login page (no browser basic-auth dialog).
// Runs on the Edge runtime — cookie + Web Crypto only, no DB access.
export const config = {
  matcher: ['/dashboard/:path*'],
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await verifySessionToken(token)) {
    return NextResponse.next()
  }
  return NextResponse.redirect(new URL('/login', req.url))
}
