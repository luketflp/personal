import { and, asc, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financeEntries, projects } from '@/lib/db/schema'
import { monthBounds } from '@/lib/finances/math'

const entryWithProject = {
  id: financeEntries.id,
  type: financeEntries.type,
  occurredOn: financeEntries.occurredOn,
  description: financeEntries.description,
  amountCents: financeEntries.amountCents,
  projectId: financeEntries.projectId,
  projectName: projects.name,
  projectColor: projects.color,
}

export function listFinanceEntries(month: string) {
  const { start, end } = monthBounds(month)

  return db
    .select(entryWithProject)
    .from(financeEntries)
    .innerJoin(projects, eq(financeEntries.projectId, projects.id))
    .where(
      and(
        gte(financeEntries.occurredOn, start),
        lt(financeEntries.occurredOn, end),
      ),
    )
    .orderBy(desc(financeEntries.occurredOn), desc(financeEntries.createdAt))
}

export function listProjectEntries(projectId: string) {
  return db
    .select(entryWithProject)
    .from(financeEntries)
    .innerJoin(projects, eq(financeEntries.projectId, projects.id))
    .where(eq(financeEntries.projectId, projectId))
    .orderBy(desc(financeEntries.occurredOn), desc(financeEntries.createdAt))
}

export function listProjects() {
  return db.select().from(projects).orderBy(asc(projects.name))
}

export async function getProject(id: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)
  return rows[0] ?? null
}

export type ProjectMonthlyStat = {
  projectId: string
  month: string
  incomeCents: number
  expenseCents: number
  entryCount: number
  lastEntryOn: string
}

// One grouped query feeds the projects overview: totals, sparklines and
// entry counts are assembled in JS from these project × month rows.
export function listProjectMonthlyStats(): Promise<ProjectMonthlyStat[]> {
  const month = sql<string>`to_char(${financeEntries.occurredOn}, 'YYYY-MM')`

  return db
    .select({
      projectId: financeEntries.projectId,
      month,
      incomeCents: sql<number>`coalesce(sum(${financeEntries.amountCents}) filter (where ${financeEntries.type} = 'income'), 0)::int`,
      expenseCents: sql<number>`coalesce(sum(${financeEntries.amountCents}) filter (where ${financeEntries.type} = 'expense'), 0)::int`,
      entryCount: sql<number>`count(*)::int`,
      lastEntryOn: sql<string>`max(${financeEntries.occurredOn})`,
    })
    .from(financeEntries)
    .groupBy(financeEntries.projectId, month)
}
