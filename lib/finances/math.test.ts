import { describe, expect, it } from 'vitest'
import {
  financeTotals,
  monthBounds,
  monthlyBalanceSeries,
  summarizeFinancesByMonth,
  summarizeFinancesByProject,
} from '@/lib/finances/math'

describe('financeTotals', () => {
  it('calculates income, expenses, and balance in cents', () => {
    expect(
      financeTotals([
        { type: 'income', amountCents: 25_000 },
        { type: 'income', amountCents: 15_000 },
        { type: 'expense', amountCents: 8_500 },
      ]),
    ).toEqual({
      incomeCents: 40_000,
      expenseCents: 8_500,
      balanceCents: 31_500,
    })
  })
})

describe('summarizeFinancesByProject', () => {
  it('groups by project id and sorts by name', () => {
    expect(
      summarizeFinancesByProject([
        { type: 'income', amountCents: 20_000, projectId: 'a', projectName: 'Rio Sucuri' },
        { type: 'expense', amountCents: 5_000, projectId: 'a', projectName: 'Rio Sucuri' },
        { type: 'income', amountCents: 10_000, projectId: 'b', projectName: 'Buraco das Araras' },
      ]),
    ).toEqual([
      {
        projectId: 'b',
        projectName: 'Buraco das Araras',
        incomeCents: 10_000,
        expenseCents: 0,
        balanceCents: 10_000,
        entryCount: 1,
      },
      {
        projectId: 'a',
        projectName: 'Rio Sucuri',
        incomeCents: 20_000,
        expenseCents: 5_000,
        balanceCents: 15_000,
        entryCount: 2,
      },
    ])
  })
})

describe('summarizeFinancesByMonth', () => {
  it('groups by YYYY-MM, newest first', () => {
    expect(
      summarizeFinancesByMonth([
        { type: 'income', amountCents: 10_000, occurredOn: '2026-08-15' },
        { type: 'expense', amountCents: 2_000, occurredOn: '2026-08-20' },
        { type: 'income', amountCents: 5_000, occurredOn: '2026-09-01' },
      ]),
    ).toEqual([
      { month: '2026-09', incomeCents: 5_000, expenseCents: 0, balanceCents: 5_000 },
      { month: '2026-08', incomeCents: 10_000, expenseCents: 2_000, balanceCents: 8_000 },
    ])
  })
})

describe('monthlyBalanceSeries', () => {
  it('fills missing months with zero, oldest first, across years', () => {
    expect(
      monthlyBalanceSeries(
        [
          { month: '2026-01', incomeCents: 0, expenseCents: 0, balanceCents: 300 },
          { month: '2025-11', incomeCents: 0, expenseCents: 0, balanceCents: 100 },
        ],
        '2026-01',
        4,
      ),
    ).toEqual([0, 100, 0, 300])
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
