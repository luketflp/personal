import { describe, expect, it } from 'vitest'
import { quoteEventSchema } from '@/lib/quotes/event-validation'

const ids = { visitorId: 'visitor_0123456', sessionId: 'session_0123456' }

describe('quoteEventSchema', () => {
  it('accepts a view with its source', () => {
    const parsed = quoteEventSchema.safeParse({
      ...ids,
      type: 'view',
      data: { source: 'site', referrer: 'https://www.google.com/search?q=x' },
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts events that carry no data', () => {
    expect(quoteEventSchema.safeParse({ ...ids, type: 'print' }).success).toBe(
      true,
    )
    expect(
      quoteEventSchema.safeParse({ ...ids, type: 'site_click' }).success,
    ).toBe(true)
  })

  it('rejects an unknown event type', () => {
    const parsed = quoteEventSchema.safeParse({ ...ids, type: 'purchase' })
    expect(parsed.success).toBe(false)
  })

  it('rejects a section outside the tracked list', () => {
    const parsed = quoteEventSchema.safeParse({
      ...ids,
      type: 'section',
      data: { name: 'footer' },
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects a scroll depth that is not a milestone', () => {
    const parsed = quoteEventSchema.safeParse({
      ...ids,
      type: 'scroll',
      data: { depth: 40 },
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects a leave with negative active time', () => {
    const parsed = quoteEventSchema.safeParse({
      ...ids,
      type: 'leave',
      data: { activeMs: -1, maxScroll: 50 },
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects ids with characters outside the id alphabet', () => {
    const parsed = quoteEventSchema.safeParse({
      type: 'print',
      visitorId: '<script>alert(1)</script>',
      sessionId: ids.sessionId,
    })
    expect(parsed.success).toBe(false)
  })

  it('drops fields the schema does not know', () => {
    const parsed = quoteEventSchema.parse({
      ...ids,
      type: 'print',
      ip: '10.0.0.1',
    })
    expect(parsed).not.toHaveProperty('ip')
  })
})
