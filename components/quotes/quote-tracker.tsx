'use client'

import { useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import {
  TRACKED_SECTIONS,
  type ScrollMilestone,
  type TrackedSection,
} from '@/lib/quotes/event-constants'
import type { QuoteEventPayload } from '@/lib/quotes/event-validation'
import { pendingMilestones, scrollPercent } from '@/lib/quotes/tracker-math'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never
type TrackedEvent = DistributiveOmit<
  QuoteEventPayload,
  'visitorId' | 'sessionId'
>

const VISITOR_KEY = 'quote_visitor_id'
// Reading time stops counting after this long without any interaction.
const IDLE_AFTER_MS = 60_000
const TICK_MS = 1000

// Pseudonymous id per browser; tells a second device or a forwarded link apart.
function readVisitorId(): string {
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY)
    if (stored) return stored
    const created = nanoid(16)
    window.localStorage.setItem(VISITOR_KEY, created)
    return created
  } catch {
    return nanoid(16)
  }
}

type Session = {
  id: string
  visitorId: string
  viewSent: boolean
  sections: Set<TrackedSection>
  milestones: ScrollMilestone[]
  activeMs: number
  maxScroll: number
  lastLeaveMs: number
}

// Reports views, read depth and actions on the public quote page. Renders
// nothing. Link-preview crawlers never run this, so they never count as views.
export function QuoteTracker({ slug }: { slug: string }) {
  // Lives in a ref so the dev-only StrictMode remount stays one session.
  const sessionRef = useRef<Session | null>(null)

  useEffect(() => {
    sessionRef.current ??= {
      id: nanoid(16),
      visitorId: readVisitorId(),
      viewSent: false,
      sections: new Set(),
      milestones: [],
      activeMs: 0,
      maxScroll: 0,
      lastLeaveMs: 0,
    }
    const session = sessionRef.current
    const endpoint = `/api/q/${slug}/events`

    const send = (event: TrackedEvent) => {
      const body = JSON.stringify({
        ...event,
        visitorId: session.visitorId,
        sessionId: session.id,
      })
      // sendBeacon survives the page being closed; fetch is the fallback.
      if (!navigator.sendBeacon?.(endpoint, body)) {
        fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(
          () => {},
        )
      }
    }

    if (!session.viewSent) {
      session.viewSent = true
      const params = new URLSearchParams(window.location.search)
      const fromSite = params.get('from') === 'site'
      send({
        type: 'view',
        data: {
          source: fromSite ? 'site' : 'direct',
          referrer: document.referrer.slice(0, 1024) || undefined,
        },
      })
      // Drop the marker so a copied URL does not pose as a return visit.
      if (fromSite) {
        params.delete('from')
        const query = params.toString()
        window.history.replaceState(
          window.history.state,
          '',
          window.location.pathname + (query ? `?${query}` : ''),
        )
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          const name = (entry.target as HTMLElement).dataset
            .trackSection as TrackedSection
          if (!TRACKED_SECTIONS.includes(name) || session.sections.has(name)) {
            continue
          }
          session.sections.add(name)
          send({ type: 'section', data: { name } })
        }
      },
      // A section counts once its top clears the lower quarter of the screen.
      { rootMargin: '0px 0px -25% 0px' },
    )
    document
      .querySelectorAll('[data-track-section]')
      .forEach(element => observer.observe(element))

    let lastInteraction = Date.now()
    const onInteraction = () => {
      lastInteraction = Date.now()
    }

    const onScroll = () => {
      onInteraction()
      const percent = scrollPercent({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        pageHeight: document.documentElement.scrollHeight,
      })
      session.maxScroll = Math.max(session.maxScroll, percent)
      for (const depth of pendingMilestones(percent, session.milestones)) {
        session.milestones.push(depth)
        send({ type: 'scroll', data: { depth } })
      }
    }
    onScroll()

    const timer = window.setInterval(() => {
      const engaged =
        document.visibilityState === 'visible' &&
        Date.now() - lastInteraction < IDLE_AFTER_MS
      if (engaged) session.activeMs += TICK_MS
    }, TICK_MS)

    // `activeMs` is a running total, so a session may report several leaves
    // (tab hidden, then shown again); the dashboard keeps the largest.
    const sendLeave = () => {
      if (session.activeMs === session.lastLeaveMs) return
      session.lastLeaveMs = session.activeMs
      send({
        type: 'leave',
        data: { activeMs: session.activeMs, maxScroll: session.maxScroll },
      })
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendLeave()
    }

    // `beforeprint` covers the print button and Ctrl/Cmd+P alike.
    const onPrint = () => send({ type: 'print' })
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest('[data-track="site_click"]')) {
        send({ type: 'site_click' })
      }
    }

    const interactions = ['pointerdown', 'pointermove', 'keydown', 'wheel']
    interactions.forEach(name =>
      window.addEventListener(name, onInteraction, { passive: true }),
    )
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('beforeprint', onPrint)
    window.addEventListener('pagehide', sendLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('click', onClick)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      interactions.forEach(name =>
        window.removeEventListener(name, onInteraction),
      )
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeprint', onPrint)
      window.removeEventListener('pagehide', sendLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('click', onClick)
      // Client-side navigation unmounts without firing `pagehide`.
      sendLeave()
    }
  }, [slug])

  return null
}
