import { FinanceSheet } from '@/components/finances/finance-sheet'
import { currentMonth, monthBounds } from '@/lib/finances/math'
import {
  listFinanceEntries,
  listFinanceTourNames,
} from '@/lib/finances/queries'

export const dynamic = 'force-dynamic'

function validMonth(value: string | string[] | undefined) {
  const month = typeof value === 'string' ? value : currentMonth()

  try {
    monthBounds(month)
    return month
  } catch {
    return currentMonth()
  }
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>
}) {
  const params = await searchParams
  const month = validMonth(params.month)
  const [entries, tourNames] = await Promise.all([
    listFinanceEntries(month),
    listFinanceTourNames(),
  ])

  return (
    <FinanceSheet
      month={month}
      tourNames={tourNames}
      entries={entries.map(entry => ({
        id: entry.id,
        type: entry.type,
        occurredOn: entry.occurredOn,
        tour: entry.tour,
        description: entry.description,
        amountCents: entry.amountCents,
      }))}
    />
  )
}
