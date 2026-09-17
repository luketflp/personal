import {
  Clock,
  Globe,
  Monitor,
  Printer,
  Smartphone,
  Tablet,
  type LucideIcon,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { badgeVariants } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SessionSummary } from '@/lib/quotes/activity'
import {
  formatDuration,
  formatEventClock,
  formatSessionTime,
} from '@/lib/quotes/activity-format'
import {
  describeEvent,
  describeSession,
  formatOpens,
} from '@/lib/quotes/activity-labels'

const DEVICE_ICONS: Record<string, LucideIcon> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
}

// Opens, exits and actions stand out; read-progress events stay quiet.
const KEY_EVENTS = new Set(['view', 'leave', 'print', 'site_click'])

// The row sits inside the accordion's <button>, so it is built from spans.
const chip = (variant: 'outline' | 'secondary') =>
  cn(badgeVariants({ variant }), 'gap-1 px-2 py-px font-medium')

function SessionRow({ session, now }: { session: SessionSummary; now: Date }) {
  const DeviceIcon = DEVICE_ICONS[session.device ?? 'desktop'] ?? Monitor

  return (
    <span className="flex flex-1 flex-col gap-3 text-left text-sm sm:flex-row sm:items-center sm:gap-4">
      <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <DeviceIcon className="size-5" />
        </span>
        <span className="min-w-0 space-y-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {formatSessionTime(session.startedAt, now)}
            </span>
            <span className={chip('outline')}>
              Visitante {session.visitorLabel}
            </span>
            {session.printed && (
              <span className={chip('secondary')}>
                <Printer className="size-3" /> Imprimiu / PDF
              </span>
            )}
            {session.visitedSite && (
              <span className={chip('secondary')}>
                <Globe className="size-3" /> Visitou o site
              </span>
            )}
          </span>
          <span className="block text-[13px] font-normal text-muted-foreground">
            {describeSession(session).join(' · ')}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-5 pl-[3.25rem] font-medium tabular-nums sm:pl-0">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" />
          {formatDuration(session.activeMs)}
        </span>
        <span className="inline-flex flex-1 items-center gap-2 sm:w-28 sm:flex-none">
          <span
            role="meter"
            aria-label="Leitura"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={session.maxScroll}
            className="h-1.5 flex-1 overflow-hidden rounded bg-border"
          >
            <span
              className="block h-1.5 rounded bg-primary"
              style={{ width: `${session.maxScroll}%` }}
            />
          </span>
          <span className="w-9 text-right">{session.maxScroll}%</span>
        </span>
      </span>
    </span>
  )
}

export function SessionList({
  sessions,
  uniqueVisitors,
  now,
}: {
  sessions: SessionSummary[]
  uniqueVisitors: number
  now: Date
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-0.5 pb-4">
        <CardTitle className="text-base">Sessões</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          {formatOpens(sessions.length, uniqueVisitors)}, mais recentes
          primeiro. Suas visitas com login não contam.
        </p>
      </CardHeader>
      <Accordion
        type="single"
        collapsible
        defaultValue={sessions[0]?.sessionId}
        className="border-t"
      >
        {sessions.map(session => (
          <AccordionItem
            key={session.sessionId}
            value={session.sessionId}
            className="last:border-b-0"
          >
            <AccordionTrigger className="gap-4 px-4 py-4 hover:no-underline sm:px-6">
              <SessionRow session={session} now={now} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5 sm:pl-20 sm:pr-6">
              <ol className="space-y-2 text-[13px]">
                {session.events.map(event => {
                  const isKey = KEY_EVENTS.has(event.type)
                  return (
                    <li key={event.id} className="flex items-baseline gap-3">
                      <span className="w-14 shrink-0 tabular-nums text-muted-foreground">
                        {formatEventClock(event.createdAt)}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'size-1.5 shrink-0 -translate-y-px rounded-full',
                          isKey ? 'bg-primary' : 'bg-muted-foreground/50',
                        )}
                      />
                      <span className={cn(isKey && 'font-medium')}>
                        {describeEvent(event, session)}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}
