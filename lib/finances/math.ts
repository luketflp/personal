import type { FinanceEntryType } from '@/lib/db/schema'

export type FinanceEntryValues = {
  type: FinanceEntryType
  amountCents: number
}

export type ProjectEntryValues = FinanceEntryValues & {
  projectId: string
  projectName: string
}

export type ProjectFinanceSummary = {
  projectId: string
  projectName: string
  incomeCents: number
  expenseCents: number
  balanceCents: number
  entryCount: number
}

export type MonthFinanceSummary = {
  month: string
  incomeCents: number
  expenseCents: number
  balanceCents: number
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

export function summarizeFinancesByProject(
  entries: ProjectEntryValues[],
): ProjectFinanceSummary[] {
  const summaries = new Map<string, ProjectFinanceSummary>()

  for (const entry of entries) {
    const summary = summaries.get(entry.projectId) ?? {
      projectId: entry.projectId,
      projectName: entry.projectName,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
      entryCount: 0,
    }

    if (entry.type === 'income') summary.incomeCents += entry.amountCents
    else summary.expenseCents += entry.amountCents

    summary.balanceCents = summary.incomeCents - summary.expenseCents
    summary.entryCount += 1
    summaries.set(entry.projectId, summary)
  }

  return [...summaries.values()].sort((a, b) =>
    collator.compare(a.projectName, b.projectName),
  )
}

// Entries carry occurredOn as 'YYYY-MM-DD'; groups by 'YYYY-MM', newest first.
export function summarizeFinancesByMonth(
  entries: (FinanceEntryValues & { occurredOn: string })[],
): MonthFinanceSummary[] {
  const summaries = new Map<string, MonthFinanceSummary>()

  for (const entry of entries) {
    const month = entry.occurredOn.slice(0, 7)
    const summary = summaries.get(month) ?? {
      month,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
    }

    if (entry.type === 'income') summary.incomeCents += entry.amountCents
    else summary.expenseCents += entry.amountCents

    summary.balanceCents = summary.incomeCents - summary.expenseCents
    summaries.set(month, summary)
  }

  return [...summaries.values()].sort((a, b) => b.month.localeCompare(a.month))
}

// Last `count` calendar months ending at `endMonth` ('YYYY-MM'), oldest first,
// with zero balance for months without entries. Feeds the card sparklines.
export function monthlyBalanceSeries(
  summaries: MonthFinanceSummary[],
  endMonth: string,
  count = 5,
): number[] {
  const byMonth = new Map(summaries.map(s => [s.month, s.balanceCents]))
  const [year, month] = endMonth.split('-').map(Number)
  const series: number[] = []

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    series.push(byMonth.get(key) ?? 0)
  }

  return series
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
