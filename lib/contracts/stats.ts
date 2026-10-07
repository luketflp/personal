import type { ContractStatus } from '@/lib/db/schema'

export type StatsRow = {
  status: ContractStatus
  currency: string
  totalCents: number
  signedAt: Date | null
}

// Calendar year in Brazil time, so a contract signed on Dec 31 at 22:00 in
// São Paulo (already Jan 1 in UTC) counts toward the year it was signed in.
export function brazilYear(date: Date) {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date),
  )
}

export function summarizeContracts(rows: StatsRow[], year: number) {
  const counts: Record<ContractStatus, number> = {
    draft: 0,
    sent: 0,
    signed: 0,
    void: 0,
  }
  const signed = new Map<string, number>()
  for (const row of rows) {
    counts[row.status] += 1
    if (
      row.status === 'signed' &&
      row.signedAt &&
      brazilYear(row.signedAt) === year
    ) {
      signed.set(row.currency, (signed.get(row.currency) ?? 0) + row.totalCents)
    }
  }
  return {
    counts,
    signedTotals: [...signed].map(([currency, totalCents]) => ({
      currency,
      totalCents,
    })),
  }
}
