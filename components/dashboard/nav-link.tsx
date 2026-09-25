'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const active =
    href === '/dashboard'
      ? !pathname.startsWith('/dashboard/requests') &&
        !pathname.startsWith('/dashboard/finances')
      : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Link>
  )
}
