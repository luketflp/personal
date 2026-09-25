import Link from 'next/link'
import { cn } from '@/lib/utils'

const tabClass = 'rounded-md px-3.5 py-1.5 text-[13px] transition-colors'

export function FinanceTabs({ active }: { active: 'month' | 'projects' }) {
  return (
    <div className="inline-flex gap-0.5 self-start rounded-lg bg-muted p-[3px]">
      <Link
        href="/dashboard/finances"
        className={cn(
          tabClass,
          active === 'month'
            ? 'bg-background font-semibold shadow-sm'
            : 'font-medium text-muted-foreground hover:text-foreground',
        )}
      >
        Visão mensal
      </Link>
      <Link
        href="/dashboard/finances/projects"
        className={cn(
          tabClass,
          active === 'projects'
            ? 'bg-background font-semibold shadow-sm'
            : 'font-medium text-muted-foreground hover:text-foreground',
        )}
      >
        Projetos
      </Link>
    </div>
  )
}
