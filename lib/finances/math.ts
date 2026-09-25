import type { FinanceEntryType } from '@/lib/db/schema'

export type FinanceEntryValues = {
  type: FinanceEntryType
  amountCents: number
  tour: string
}

export type TourFinanceSummary = {
  tour: string
  incomeCents: number
  expenseCents: number
  balanceCents: number
  entryCount: number
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

export function financeTotals(entries: FinanceEntryValues[]) {
  const totals = entries.reduce(
    (result, entry) => {
      if (entry.type === 'income') result.incomeCents += entry.amountCents
      else result.expenseCents += entry.amountCents
      return result
    },
    { incomeCents: 0, expenseCents: 0 },
  )

  return {
    ...totals,
    balanceCents: totals.incomeCents - totals.expenseCents,
  }
}

export function summarizeFinancesByTour(
  entries: FinanceEntryValues[],
): TourFinanceSummary[] {
  const summaries = new Map<string, TourFinanceSummary>()

  for (const entry of entries) {
    const tour = entry.tour.trim()
    const key = tour.toLocaleLowerCase('pt-BR')
    const summary = summaries.get(key) ?? {
      tour,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
      entryCount: 0,
    }

    if (entry.type === 'income') summary.incomeCents += entry.amountCents
    else summary.expenseCents += entry.amountCents

    summary.balanceCents = summary.incomeCents - summary.expenseCents
    summary.entryCount += 1
    summaries.set(key, summary)
  }

  return [...summaries.values()].sort((a, b) =>
    collator.compare(a.tour, b.tour),
  )
}

export function monthBounds(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) throw new Error('Invalid month')

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) throw new Error('Invalid month')

  const start = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
  const next = new Date(Date.UTC(year, monthIndex + 1, 1))
  const end = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`

  return { start, end }
}

export function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonth(month: string) {
  const { start } = monthBounds(month)
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${start}T00:00:00`))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
