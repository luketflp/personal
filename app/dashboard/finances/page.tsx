import { FinanceSheet } from '@/components/finances/finance-sheet'
import { currentMonth, monthBounds } from '@/lib/finances/math'
import { listFinanceEntries, listProjects } from '@/lib/finances/queries'

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
  const [entries, projects] = await Promise.all([
    listFinanceEntries(month),
    listProjects(),
  ])

  return (
    <FinanceSheet
      month={month}
      projects={projects.map(project => ({
        id: project.id,
        name: project.name,
      }))}
      entries={entries}
    />
  )
}
