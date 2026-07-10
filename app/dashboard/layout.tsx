import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/auth/logout-button'
import { NavLink } from '@/components/dashboard/nav-link'
import { countNewRequests } from '@/lib/quotes/request-queries'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const newRequests = await countNewRequests()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <nav className="flex items-center gap-1">
            <NavLink href="/dashboard">Orçamentos</NavLink>
            <NavLink href="/dashboard/requests">
              <span className="inline-flex items-center gap-2">
                Mensagens
                {newRequests > 0 && (
                  <Badge className="h-5 min-w-5 justify-center px-1">
                    {newRequests}
                  </Badge>
                )}
              </span>
            </NavLink>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
