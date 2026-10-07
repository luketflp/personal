import { describe, expect, it } from 'vitest'
import { brazilYear, summarizeContracts } from '@/lib/contracts/stats'

describe('brazilYear', () => {
  it('uses São Paulo time at the year boundary', () => {
    // Dec 31, 22:00 in São Paulo.
    expect(brazilYear(new Date('2027-01-01T01:00:00Z'))).toBe(2026)
    expect(brazilYear(new Date('2027-01-01T03:00:00Z'))).toBe(2027)
  })
})

describe('summarizeContracts', () => {
  it('counts every status and sums signed totals per currency for the year', () => {
    const result = summarizeContracts(
      [
        {
          status: 'draft',
          currency: 'BRL',
          totalCents: 100_000,
          signedAt: null,
        },
        {
          status: 'sent',
          currency: 'BRL',
          totalCents: 200_000,
          signedAt: null,
        },
        {
          status: 'signed',
          currency: 'BRL',
          totalCents: 350_000,
          signedAt: new Date('2026-09-29T15:00:00Z'),
        },
        {
          status: 'signed',
          currency: 'BRL',
          totalCents: 240_000,
          signedAt: new Date('2027-01-01T01:00:00Z'),
        },
        {
          status: 'signed',
          currency: 'USD',
          totalCents: 120_000,
          signedAt: new Date('2026-09-22T12:18:00Z'),
        },
        {
          status: 'signed',
          currency: 'BRL',
          totalCents: 999_900,
          signedAt: new Date('2025-12-31T12:00:00Z'),
        },
        {
          status: 'void',
          currency: 'BRL',
          totalCents: 240_000,
          signedAt: null,
        },
      ],
      2026,
    )
    expect(result.counts).toEqual({ draft: 1, sent: 1, signed: 4, void: 1 })
    expect(result.signedTotals).toEqual([
      { currency: 'BRL', totalCents: 590_000 },
      { currency: 'USD', totalCents: 120_000 },
    ])
  })

  it('returns zero counts and no totals for no contracts', () => {
    expect(summarizeContracts([], 2026)).toEqual({
      counts: { draft: 0, sent: 0, signed: 0, void: 0 },
      signedTotals: [],
    })
  })
})
