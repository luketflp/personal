import { describe, expect, it } from 'vitest'
import type { QuoteEvent } from '@/lib/db/schema'
import type { SessionSummary } from '@/lib/quotes/activity'
import {
  describeEvent,
  describeSession,
  formatOpens,
} from '@/lib/quotes/activity-labels'

function session(extra: Partial<SessionSummary> = {}): SessionSummary {
  return {
    sessionId: 's1',
    visitorId: 'v1',
    visitorLabel: 'A',
    startedAt: new Date('2026-09-17T11:14:00Z'),
    device: 'mobile',
    browser: 'Safari',
    os: 'iOS',
    city: 'Florianópolis',
    region: 'SC',
    country: 'BR',
    referrerHost: null,
    source: 'direct',
    activeMs: 0,
    maxScroll: 0,
    sections: [],
    printed: false,
    visitedSite: false,
    isFirstOpen: false,
    events: [],
    ...extra,
  }
}

function event(
  type: QuoteEvent['type'],
  data: QuoteEvent['data'] = null,
): QuoteEvent {
  return {
    id: 'e1',
    quoteId: 'q1',
    type,
    visitorId: 'v1',
    sessionId: 's1',
    data,
    device: null,
    browser: null,
    os: null,
    referrerHost: null,
    country: null,
    region: null,
    city: null,
    createdAt: new Date('2026-09-17T11:14:00Z'),
  }
}

describe('describeSession', () => {
  it('names the device, browser, place and how the visitor arrived', () => {
    expect(describeSession(session())).toEqual([
      'iPhone',
      'Safari',
      'Florianópolis, SC',
      'acesso direto',
    ])
  })

  it('says when the visitor came back from the site', () => {
    expect(describeSession(session({ source: 'site' }))).toContain(
      'voltou do site',
    )
  })

  it('credits an external referrer', () => {
    expect(
      describeSession(session({ referrerHost: 'mail.google.com' })),
    ).toContain('via mail.google.com')
  })

  it('marks the first open', () => {
    expect(describeSession(session({ isFirstOpen: true })).at(-1)).toBe(
      'primeira abertura',
    )
  })

  it('falls back to the country and skips what is unknown', () => {
    expect(
      describeSession(
        session({ os: 'Windows', browser: null, city: null, region: null }),
      ),
    ).toEqual(['Windows', 'BR', 'acesso direto'])
  })
})

describe('describeEvent', () => {
  it('describes a first, a returning and a regular open', () => {
    const view = event('view', { source: 'direct' })
    expect(describeEvent(view, session({ isFirstOpen: true }))).toBe(
      'Abriu o orçamento pela primeira vez',
    )
    expect(describeEvent(view, session({ source: 'site' }))).toBe(
      'Voltou do site para o orçamento',
    )
    expect(describeEvent(view, session())).toBe('Abriu o orçamento')
  })

  it('names the section that was seen', () => {
    expect(
      describeEvent(event('section', { name: 'payment' }), session()),
    ).toBe('Viu a seção Pagamento')
  })

  it('describes scroll, print, site click and leave', () => {
    expect(describeEvent(event('scroll', { depth: 75 }), session())).toBe(
      'Rolou até 75%',
    )
    expect(describeEvent(event('print'), session())).toBe(
      'Imprimiu ou salvou em PDF',
    )
    expect(describeEvent(event('site_click'), session())).toBe(
      'Clicou para visitar o site',
    )
    expect(
      describeEvent(
        event('leave', { activeMs: 130_000, maxScroll: 100 }),
        session(),
      ),
    ).toBe('Saiu da página, 2m 10s de leitura ativa')
  })
})

describe('formatOpens', () => {
  it('pluralizes opens and visitors independently', () => {
    expect(formatOpens(4, 2)).toBe('4 aberturas · 2 visitantes')
    expect(formatOpens(3, 1)).toBe('3 aberturas · 1 visitante')
    expect(formatOpens(1, 1)).toBe('1 abertura · 1 visitante')
  })
})
