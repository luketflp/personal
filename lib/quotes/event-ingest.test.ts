import { describe, expect, it } from 'vitest'
import { buildEventRow } from '@/lib/quotes/event-ingest'

const ids = { visitorId: 'visitor_0123456', sessionId: 'session_0123456' }
const quoteId = '7b0c4f0e-6a57-4f6e-9a39-0d9d3c1f2a11'
const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

const headers = new Headers({
  'user-agent': iphone,
  host: 'site.com',
  'x-vercel-ip-country': 'BR',
  'x-vercel-ip-country-region': 'SC',
  'x-vercel-ip-city': 'Florian%C3%B3polis',
})

describe('buildEventRow', () => {
  it('attaches device, geo and referrer host to a view', () => {
    const row = buildEventRow({
      quoteId,
      headers,
      event: {
        ...ids,
        type: 'view',
        data: { source: 'direct', referrer: 'https://www.instagram.com/p/x' },
      },
    })

    expect(row).toEqual({
      quoteId,
      ...ids,
      type: 'view',
      data: { source: 'direct' },
      device: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      referrerHost: 'instagram.com',
      country: 'BR',
      region: 'SC',
      city: 'Florianópolis',
    })
  })

  it('never stores the full referrer url', () => {
    const row = buildEventRow({
      quoteId,
      headers,
      event: {
        ...ids,
        type: 'view',
        data: {
          source: 'site',
          referrer: 'https://mail.google.com/u/0/#inbox',
        },
      },
    })

    expect(JSON.stringify(row)).not.toContain('#inbox')
  })

  it('keeps context columns empty on follow-up events', () => {
    const row = buildEventRow({
      quoteId,
      headers,
      event: { ...ids, type: 'scroll', data: { depth: 50 } },
    })

    expect(row).toEqual({
      quoteId,
      ...ids,
      type: 'scroll',
      data: { depth: 50 },
    })
  })

  it('stores null data for events that carry none', () => {
    const row = buildEventRow({
      quoteId,
      headers,
      event: { ...ids, type: 'print' },
    })

    expect(row.data).toBeNull()
  })
})
