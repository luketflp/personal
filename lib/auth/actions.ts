'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, createSessionToken } from '@/lib/auth/session'

export async function login(
  username: string,
  password: string,
): Promise<{ ok: boolean }> {
  if (
    !username ||
    !password ||
    username !== process.env.DASHBOARD_USER ||
    password !== process.env.DASHBOARD_PASSWORD
  ) {
    return { ok: false }
  }
  const store = await cookies()
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return { ok: true }
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
