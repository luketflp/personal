import { desc, like } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import { quotes } from '@/lib/db/schema'

function codeYear(date: string | Date | null | undefined) {
  if (date instanceof Date) return date.getFullYear()
  if (typeof date === 'string') {
    const year = Number(date.slice(0, 4))
    if (Number.isInteger(year) && year > 0) return year
  }
  return new Date().getFullYear()
}

// PREFIX-YYYY-NNN, continuing from the highest code issued that year.
export async function nextSequentialCode(
  table: PgTable,
  column: PgColumn,
  prefix: string,
  date: string | Date,
) {
  const start = `${prefix}-${codeYear(date)}-`
  const [latest] = await db
    .select({ code: column })
    .from(table)
    .where(like(column, `${start}%`))
    .orderBy(desc(column))
    .limit(1)

  const next = latest ? Number(String(latest.code).slice(start.length)) + 1 : 1
  return `${start}${String(next).padStart(3, '0')}`
}

export function nextQuoteCode(issueDate: string | Date) {
  return nextSequentialCode(quotes, quotes.code, 'LA', issueDate)
}
