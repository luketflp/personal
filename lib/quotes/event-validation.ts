import { z } from 'zod'
import { TRACKED_SECTIONS } from '@/lib/quotes/event-constants'

// Longest active time a single page load may report (6 hours).
const MAX_ACTIVE_MS = 6 * 60 * 60 * 1000

// Client-generated ids (nanoid alphabet).
const trackingId = z.string().regex(/^[\w-]{8,24}$/)
const ids = { visitorId: trackingId, sessionId: trackingId }

export const quoteEventSchema = z.discriminatedUnion('type', [
  z.object({
    ...ids,
    type: z.literal('view'),
    data: z.object({
      source: z.enum(['direct', 'site']),
      referrer: z.string().max(1024).optional(),
    }),
  }),
  z.object({
    ...ids,
    type: z.literal('section'),
    data: z.object({ name: z.enum(TRACKED_SECTIONS) }),
  }),
  z.object({
    ...ids,
    type: z.literal('scroll'),
    data: z.object({
      depth: z.union([
        z.literal(25),
        z.literal(50),
        z.literal(75),
        z.literal(100),
      ]),
    }),
  }),
  z.object({
    ...ids,
    type: z.literal('leave'),
    data: z.object({
      activeMs: z.number().int().min(0).max(MAX_ACTIVE_MS),
      maxScroll: z.number().int().min(0).max(100),
    }),
  }),
  z.object({ ...ids, type: z.literal('print') }),
  z.object({ ...ids, type: z.literal('site_click') }),
])

export type QuoteEventPayload = z.infer<typeof quoteEventSchema>
export type QuoteEventType = QuoteEventPayload['type']
