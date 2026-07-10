// Session token shared by the middleware (Edge) and server actions (Node).
// Both runtimes expose Web Crypto, so this stays runtime-agnostic and never
// touches the DB. The token proves knowledge of DASHBOARD_PASSWORD without
// storing it in the cookie.
export const SESSION_COOKIE = 'dash_session'
const PAYLOAD = 'dashboard-session-v1'

function getSecret(): string {
  const secret = process.env.DASHBOARD_PASSWORD
  if (!secret) throw new Error('DASHBOARD_PASSWORD is not set')
  return secret
}

async function hmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSessionToken(): Promise<string> {
  return hmac(PAYLOAD, getSecret())
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false
  const expected = await createSessionToken()
  if (token.length !== expected.length) return false
  // Constant-time compare.
  let diff = 0
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}
