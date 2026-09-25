import { describe, expect, it } from 'vitest'
import {
  financeTotals,
  monthBounds,
  summarizeFinancesByTour,
} from '@/lib/finances/math'

describe('financeTotals', () => {
  it('calculates income, expenses, and balance in cents', () => {
    expect(
      financeTotals([
        { type: 'income', amountCents: 25_000, tour: 'Rio da Prata' },
        { type: 'income', amountCents: 15_000, tour: 'Rio da Prata' },
        { type: 'expense', amountCents: 8_500, tour: 'Rio da Prata' },
      ]),
    ).toEqual({
      incomeCents: 40_000,
      expenseCents: 8_500,
      balanceCents: 31_500,
    })
  })
})

describe('summarizeFinancesByTour', () => {
  it('groups tour names without case sensitivity', () => {
    expect(
      summarizeFinancesByTour([
        { type: 'income', amountCents: 20_000, tour: 'Rio Sucuri' },
        { type: 'expense', amountCents: 5_000, tour: 'rio sucuri' },
        { type: 'income', amountCents: 10_000, tour: 'Buraco das Araras' },
      ]),
    ).toEqual([
      {
        tour: 'Buraco das Araras',
        incomeCents: 10_000,
        expenseCents: 0,
        balanceCents: 10_000,
        entryCount: 1,
      },
      {
        tour: 'Rio Sucuri',
        incomeCents: 20_000,
        expenseCents: 5_000,
        balanceCents: 15_000,
        entryCount: 2,
      },
    ])
  })
})

describe('monthBounds', () => {
  it('returns an exclusive upper bound across years', () => {
    expect(monthBounds('2026-12')).toEqual({
      start: '2026-12-01',
      end: '2027-01-01',
    })
  })

  it('rejects malformed and out-of-range months', () => {
    expect(() => monthBounds('2026-13')).toThrow('Invalid month')
    expect(() => monthBounds('September')).toThrow('Invalid month')
  })
})
