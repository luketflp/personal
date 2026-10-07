import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

// Server action endpoints can be called directly, outside the /dashboard
// middleware, so owner-only actions check the session themselves.
export async function requireOwner() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) throw new Error('Unauthorized')
}
