import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import type { QuoteStatus } from '@/lib/db/schema'
import { formatLastSeen } from '@/lib/quotes/activity-format'
import { formatOpens } from '@/lib/quotes/activity-labels'
import type { ActivitySummary } from '@/lib/quotes/event-queries'

const DAY_MS = 24 * 60 * 60 * 1000

// Quotes-table cell: doubles as the link to the quote's activity page.
export function ActivityCell({
  quoteId,
  status,
  summary,
  now,
}: {
  quoteId: string
  status: QuoteStatus
  summary: ActivitySummary | undefined
  now: Date
}) {
  if (!summary && status === 'draft') {
    return <span className="text-muted-foreground">Ainda não enviado</span>
  }

  const href = `/dashboard/${quoteId}`
  const linkClass =
    '-mx-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  if (!summary) {
    return (
      <Link
        href={href}
        className={`${linkClass} inline-flex items-center gap-1.5 text-muted-foreground`}
      >
        <EyeOff className="size-3.5" /> Não aberto
      </Link>
    )
  }

  const seenRecently =
    summary.lastSeenAt !== null &&
    now.getTime() - summary.lastSeenAt.getTime() < DAY_MS

  return (
    <Link href={href} className={`${linkClass} flex flex-col gap-0.5`}>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium">
        <Eye className="size-3.5" />
        {formatOpens(summary.opens, summary.visitors)}
      </span>
      {summary.lastSeenAt && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          {seenRecently && (
            <span aria-hidden className="size-1.5 rounded-full bg-green-600" />
          )}
          visto {formatLastSeen(summary.lastSeenAt, now)}
        </span>
      )}
    </Link>
  )
}
