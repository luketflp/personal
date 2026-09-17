import type { NewQuoteEvent } from '@/lib/db/schema'
import type { QuoteEventPayload } from '@/lib/quotes/event-validation'
import {
  geoFromHeaders,
  parseUserAgent,
  referrerHost,
} from '@/lib/quotes/visitor-context'

// Events one page load may record before the rest is dropped.
export const MAX_EVENTS_PER_SESSION = 60
export const MAX_EVENT_BODY_BYTES = 2048

// Maps a validated payload to its row. Only `view` carries visitor context,
// reduced to coarse labels: no IP, no raw user agent, no full referrer URL.
export function buildEventRow({
  quoteId,
  event,
  headers,
}: {
  quoteId: string
  event: QuoteEventPayload
  headers: Headers
}): NewQuoteEvent {
  const base = {
    quoteId,
    visitorId: event.visitorId,
    sessionId: event.sessionId,
  }

  if (event.type !== 'view') {
    return {
      ...base,
      type: event.type,
      data: 'data' in event ? event.data : null,
    }
  }

  return {
    ...base,
    type: 'view',
    data: { source: event.data.source },
    ...parseUserAgent(headers.get('user-agent') ?? ''),
    referrerHost: referrerHost(event.data.referrer, headers.get('host')),
    ...geoFromHeaders(headers),
  }
}
