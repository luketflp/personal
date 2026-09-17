import { describe, expect, it } from 'vitest'
import type { QuoteEvent } from '@/lib/db/schema'
import { buildQuoteActivity } from '@/lib/quotes/activity'

let seq = 0

function event(
  at: string,
  type: QuoteEvent['type'],
  sessionId: string,
  visitorId: string,
  extra: Partial<QuoteEvent> = {},
): QuoteEvent {
  return {
    id: `event-${++seq}`,
    quoteId: 'quote-1',
    type,
    visitorId,
    sessionId,
    data: null,
    device: null,
    browser: null,
    os: null,
    referrerHost: null,
    country: null,
    region: null,
    city: null,
    createdAt: new Date(at),
    ...extra,
  }
}

const iphone = { device: 'mobile', browser: 'Safari', os: 'iOS' }

// Visitor "ana" opens twice (the second time coming back from the site);
// visitor "bruno" opens once on desktop and prints.
const events: QuoteEvent[] = [
  event('2026-09-16T17:20:03Z', 'view', 's1', 'ana', {
    ...iphone,
    city: 'Florianópolis',
    region: 'SC',
    country: 'BR',
    data: { source: 'direct' },
  }),
  event('2026-09-16T17:20:15Z', 'section', 's1', 'ana', {
    data: { name: 'scope' },
  }),
  event('2026-09-16T17:20:16Z', 'section', 's1', 'ana', {
    data: { name: 'items' },
  }),
  event('2026-09-16T17:21:02Z', 'scroll', 's1', 'ana', { data: { depth: 75 } }),
  event('2026-09-16T17:21:38Z', 'site_click', 's1', 'ana'),
  event('2026-09-16T17:21:42Z', 'leave', 's1', 'ana', {
    data: { activeMs: 99_000, maxScroll: 82 },
  }),

  event('2026-09-16T17:32:10Z', 'view', 's2', 'ana', {
    ...iphone,
    data: { source: 'site' },
  }),
  event('2026-09-16T17:32:18Z', 'section', 's2', 'ana', {
    data: { name: 'scope' },
  }),
  event('2026-09-16T17:32:40Z', 'leave', 's2', 'ana', {
    data: { activeMs: 20_000, maxScroll: 40 },
  }),
  event('2026-09-16T17:32:58Z', 'leave', 's2', 'ana', {
    data: { activeMs: 48_000, maxScroll: 60 },
  }),

  event('2026-09-17T00:47:30Z', 'view', 's3', 'bruno', {
    device: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    referrerHost: 'mail.google.com',
    data: { source: 'direct' },
  }),
  event('2026-09-17T00:47:44Z', 'section', 's3', 'bruno', {
    data: { name: 'scope' },
  }),
  event('2026-09-17T00:49:40Z', 'scroll', 's3', 'bruno', {
    data: { depth: 100 },
  }),
  event('2026-09-17T00:50:21Z', 'print', 's3', 'bruno'),
]

describe('buildQuoteActivity', () => {
  const activity = buildQuoteActivity(events)

  it('counts one open per page load and distinct visitors', () => {
    expect(activity.opens).toBe(3)
    expect(activity.uniqueVisitors).toBe(2)
  })

  it('lists sessions newest first', () => {
    expect(activity.sessions.map(s => s.sessionId)).toEqual(['s3', 's2', 's1'])
  })

  it('reports the last time anything happened', () => {
    expect(activity.lastSeenAt).toEqual(new Date('2026-09-17T00:50:21Z'))
  })

  it('takes the longest active time when a session reports several leaves', () => {
    const s2 = activity.sessions.find(s => s.sessionId === 's2')
    expect(s2?.activeMs).toBe(48_000)
    expect(s2?.maxScroll).toBe(60)
  })

  it('sums read time across sessions', () => {
    // s3 never sent a leave, so it adds nothing.
    expect(activity.totalActiveMs).toBe(99_000 + 48_000)
  })

  it('uses scroll milestones when no leave arrived', () => {
    const s3 = activity.sessions.find(s => s.sessionId === 's3')
    expect(s3?.maxScroll).toBe(100)
    expect(activity.maxScroll).toBe(100)
  })

  it('carries the view context and source onto the session', () => {
    const [s3, s2, s1] = activity.sessions
    expect(s1).toMatchObject({
      device: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      city: 'Florianópolis',
      region: 'SC',
      source: 'direct',
    })
    expect(s2.source).toBe('site')
    expect(s3.referrerHost).toBe('mail.google.com')
  })

  it('labels visitors by order of first appearance', () => {
    const [s3, s2, s1] = activity.sessions
    expect(s1.visitorLabel).toBe('A')
    expect(s2.visitorLabel).toBe('A')
    expect(s3.visitorLabel).toBe('B')
  })

  it('marks only the oldest session as the first open', () => {
    expect(activity.sessions.map(s => s.isFirstOpen)).toEqual([
      false,
      false,
      true,
    ])
  })

  it('flags the actions taken in each session', () => {
    const [s3, , s1] = activity.sessions
    expect(s3).toMatchObject({ printed: true, visitedSite: false })
    expect(s1).toMatchObject({ printed: false, visitedSite: true })
  })

  it('counts how many sessions reached each section, in page order', () => {
    expect(activity.sectionReach).toEqual([
      { name: 'scope', sessions: 3 },
      { name: 'items', sessions: 1 },
      { name: 'totals', sessions: 0 },
      { name: 'payment', sessions: 0 },
      { name: 'notes', sessions: 0 },
    ])
  })

  it('totals the actions', () => {
    expect(activity.actions).toEqual({ prints: 1, siteClicks: 1, returns: 1 })
  })

  it('keeps the events of a session in chronological order', () => {
    const s1 = activity.sessions.find(s => s.sessionId === 's1')
    expect(s1?.events.map(e => e.type)).toEqual([
      'view',
      'section',
      'section',
      'scroll',
      'site_click',
      'leave',
    ])
  })

  it('does not count a section twice within one session', () => {
    const doubled = buildQuoteActivity([
      event('2026-09-16T10:00:00Z', 'view', 'x', 'v'),
      event('2026-09-16T10:00:01Z', 'section', 'x', 'v', {
        data: { name: 'scope' },
      }),
      event('2026-09-16T10:00:02Z', 'section', 'x', 'v', {
        data: { name: 'scope' },
      }),
    ])
    expect(doubled.sectionReach[0]).toEqual({ name: 'scope', sessions: 1 })
  })

  it('returns an empty summary when nothing was recorded', () => {
    expect(buildQuoteActivity([])).toEqual({
      opens: 0,
      uniqueVisitors: 0,
      totalActiveMs: 0,
      maxScroll: 0,
      lastSeenAt: null,
      sectionReach: [
        { name: 'scope', sessions: 0 },
        { name: 'items', sessions: 0 },
        { name: 'totals', sessions: 0 },
        { name: 'payment', sessions: 0 },
        { name: 'notes', sessions: 0 },
      ],
      actions: { prints: 0, siteClicks: 0, returns: 0 },
      sessions: [],
    })
  })
})
