import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Users,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActionsCard } from '@/components/quotes/activity/actions-card'
import { CopyLinkButton } from '@/components/quotes/activity/copy-link-button'
import { SectionReach } from '@/components/quotes/activity/section-reach'
import { SessionList } from '@/components/quotes/activity/session-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatMoney } from '@/lib/format'
import { buildQuoteActivity } from '@/lib/quotes/activity'
import { formatDuration, formatLastSeen } from '@/lib/quotes/activity-format'
import type { TrackedSection } from '@/lib/quotes/event-constants'
import { listQuoteEvents } from '@/lib/quotes/event-queries'
import { quoteLocale } from '@/lib/quotes/language'
import { getQuoteById } from '@/lib/quotes/queries'
import { QUOTE_STATUS_BADGES } from '@/lib/quotes/status'
import { computeTotals } from '@/lib/quotes/totals'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function QuoteActivityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Anything under /dashboard/* lands here; keep non-ids away from the DB.
  if (!UUID.test(id)) notFound()

  const [quote, events] = await Promise.all([
    getQuoteById(id),
    listQuoteEvents(id),
  ])
  if (!quote) notFound()

  const now = new Date()
  const activity = buildQuoteActivity(events)
  const status = QUOTE_STATUS_BADGES[quote.status]
  const { totalCents } = computeTotals(quote.items, quote.discountCents)

  // Only sections this quote actually renders can be reached.
  const rendered: Record<TrackedSection, boolean> = {
    scope: Boolean(quote.scope),
    items: true,
    totals: true,
    payment: Boolean(quote.payment),
    notes: Boolean(quote.notes || quote.terms),
  }

  const details = [
    quote.code,
    quote.customerCompany,
    `emitido em ${formatDate(quote.issueDate)}`,
    quote.validUntil && `válido até ${formatDate(quote.validUntil)}`,
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Orçamentos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight">
                {quote.customerName}
              </h2>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {details.join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-semibold leading-tight">
                {formatMoney(
                  totalCents,
                  quote.currency,
                  quoteLocale(quote.language),
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/q/${quote.slug}`} target="_blank">
                  <ExternalLink className="size-4" /> Ver público
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/dashboard/${quote.id}/edit`}>
                  <Pencil className="size-4" /> Editar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {activity.opens === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <EyeOff className="size-6" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="font-semibold">Ainda não aberto</h3>
              <p className="text-sm text-muted-foreground">
                Quando o cliente abrir o link, as visitas, o tempo de leitura e
                as ações aparecem aqui. Suas próprias visitas com login não
                contam.
              </p>
            </div>
            <CopyLinkButton slug={quote.slug} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Aberturas" value={activity.opens} icon={Eye} />
            <StatCard
              label="Visitantes únicos"
              value={activity.uniqueVisitors}
              icon={Users}
            />
            <StatCard
              label="Tempo de leitura"
              value={formatDuration(activity.totalActiveMs)}
              icon={Clock}
            />
            <StatCard
              label="Leitura máxima"
              value={`${activity.maxScroll}%`}
              icon={BookOpen}
            />
            <div className="col-span-2 lg:col-span-1">
              <StatCard
                label="Última visita"
                value={
                  activity.lastSeenAt
                    ? formatLastSeen(activity.lastSeenAt, now)
                    : '—'
                }
                icon={Activity}
              />
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <SessionList
              sessions={activity.sessions}
              uniqueVisitors={activity.uniqueVisitors}
              now={now}
            />
            <div className="space-y-6">
              <SectionReach
                reach={activity.sectionReach.filter(s => rendered[s.name])}
                opens={activity.opens}
              />
              <ActionsCard actions={activity.actions} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
