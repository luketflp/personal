import type { QuoteEvent } from '@/lib/db/schema'
import {
  TRACKED_SECTIONS,
  type TrackedSection,
} from '@/lib/quotes/event-constants'

export type SessionSummary = {
  sessionId: string
  visitorId: string
  // "A", "B"... by order of first appearance, to tell visitors apart.
  visitorLabel: string
  startedAt: Date
  device: string | null
  browser: string | null
  os: string | null
  city: string | null
  region: string | null
  country: string | null
  referrerHost: string | null
  source: 'direct' | 'site'
  activeMs: number
  maxScroll: number
  sections: TrackedSection[]
  printed: boolean
  visitedSite: boolean
  isFirstOpen: boolean
  events: QuoteEvent[]
}

export type QuoteActivity = {
  opens: number
  uniqueVisitors: number
  totalActiveMs: number
  maxScroll: number
  lastSeenAt: Date | null
  sectionReach: Array<{ name: TrackedSection; sessions: number }>
  actions: { prints: number; siteClicks: number; returns: number }
  sessions: SessionSummary[]
}

function visitorLabel(index: number) {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1)
}

const numberField = (event: QuoteEvent, key: string) => {
  const value = event.data?.[key]
  return typeof value === 'number' ? value : 0
}

function summarizeSession(
  events: QuoteEvent[],
  label: string,
): Omit<SessionSummary, 'isFirstOpen'> {
  const first = events[0]
  const view = events.find(e => e.type === 'view')
  const sections = new Set<TrackedSection>()
  let activeMs = 0
  let maxScroll = 0

  for (const e of events) {
    if (e.type === 'section') {
      const name = e.data?.name as TrackedSection
      if (TRACKED_SECTIONS.includes(name)) sections.add(name)
    } else if (e.type === 'scroll') {
      maxScroll = Math.max(maxScroll, numberField(e, 'depth'))
    } else if (e.type === 'leave') {
      // A tab that is hidden and shown again reports a running total each time.
      activeMs = Math.max(activeMs, numberField(e, 'activeMs'))
      maxScroll = Math.max(maxScroll, numberField(e, 'maxScroll'))
    }
  }

  return {
    sessionId: first.sessionId,
    visitorId: first.visitorId,
    visitorLabel: label,
    startedAt: first.createdAt,
    device: view?.device ?? null,
    browser: view?.browser ?? null,
    os: view?.os ?? null,
    city: view?.city ?? null,
    region: view?.region ?? null,
    country: view?.country ?? null,
    referrerHost: view?.referrerHost ?? null,
    source: view?.data?.source === 'site' ? 'site' : 'direct',
    activeMs,
    maxScroll,
    sections: TRACKED_SECTIONS.filter(name => sections.has(name)),
    printed: events.some(e => e.type === 'print'),
    visitedSite: events.some(e => e.type === 'site_click'),
    events,
  }
}

// Folds the raw event log of one quote into sessions (one per page load) and
// the totals shown on the activity page.
export function buildQuoteActivity(events: QuoteEvent[]): QuoteActivity {
  const ordered = [...events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )

  const bySession = new Map<string, QuoteEvent[]>()
  const visitors: string[] = []
  for (const e of ordered) {
    const list = bySession.get(e.sessionId)
    if (list) list.push(e)
    else bySession.set(e.sessionId, [e])
    if (!visitors.includes(e.visitorId)) visitors.push(e.visitorId)
  }

  // Map keeps insertion order, so sessions come out oldest first.
  const sessions = [...bySession.values()].map((list, index) => ({
    ...summarizeSession(
      list,
      visitorLabel(visitors.indexOf(list[0].visitorId)),
    ),
    isFirstOpen: index === 0,
  }))

  return {
    opens: sessions.length,
    uniqueVisitors: visitors.length,
    totalActiveMs: sessions.reduce((sum, s) => sum + s.activeMs, 0),
    maxScroll: sessions.reduce((max, s) => Math.max(max, s.maxScroll), 0),
    lastSeenAt: ordered.at(-1)?.createdAt ?? null,
    sectionReach: TRACKED_SECTIONS.map(name => ({
      name,
      sessions: sessions.filter(s => s.sections.includes(name)).length,
    })),
    actions: {
      prints: ordered.filter(e => e.type === 'print').length,
      siteClicks: ordered.filter(e => e.type === 'site_click').length,
      returns: sessions.filter(s => s.source === 'site').length,
    },
    sessions: sessions.reverse(),
  }
}
