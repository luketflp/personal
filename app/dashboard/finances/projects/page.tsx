import Link from 'next/link'
import { Monitor, Mountain, Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FinanceTabs } from '@/components/finances/finance-tabs'
import { NewProjectDialog } from '@/components/finances/new-project-dialog'
import { Sparkline } from '@/components/finances/sparkline'
import { formatMoney } from '@/lib/format'
import { currentMonth, monthlyBalanceSeries } from '@/lib/finances/math'
import { listProjectMonthlyStats, listProjects } from '@/lib/finances/queries'

import type { ProjectKind } from '@/lib/db/schema'
import type { MonthFinanceSummary } from '@/lib/finances/math'

export const dynamic = 'force-dynamic'

const KIND_LABELS: Record<ProjectKind, string> = {
  passeio: 'Passeio',
  servico: 'Serviço',
  outro: 'Projeto',
}

const KIND_ICONS: Record<ProjectKind, typeof Mountain> = {
  passeio: Mountain,
  servico: Monitor,
  outro: Package,
}

export default async function ProjectsPage() {
  const [projects, stats] = await Promise.all([
    listProjects(),
    listProjectMonthlyStats(),
  ])

  const month = currentMonth()
  const year = month.slice(0, 4)

  const byProject = new Map<
    string,
    {
      incomeCents: number
      expenseCents: number
      entryCount: number
      months: MonthFinanceSummary[]
    }
  >()
  let yearIncomeCents = 0
  let yearExpenseCents = 0
  let yearEntryCount = 0

  for (const stat of stats) {
    const summary = byProject.get(stat.projectId) ?? {
      incomeCents: 0,
      expenseCents: 0,
      entryCount: 0,
      months: [],
    }
    summary.incomeCents += stat.incomeCents
    summary.expenseCents += stat.expenseCents
    summary.entryCount += stat.entryCount
    summary.months.push({
      month: stat.month,
      incomeCents: stat.incomeCents,
      expenseCents: stat.expenseCents,
      balanceCents: stat.incomeCents - stat.expenseCents,
    })
    byProject.set(stat.projectId, summary)

    if (stat.month.startsWith(year)) {
      yearIncomeCents += stat.incomeCents
      yearExpenseCents += stat.expenseCents
      yearEntryCount += stat.entryCount
    }
  }

  const yearTotal = yearIncomeCents + yearExpenseCents
  const incomeShare = yearTotal ? (yearIncomeCents / yearTotal) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resultado por projeto e visão geral do ano.
          </p>
        </div>
        <NewProjectDialog
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" /> Novo projeto
            </Button>
          }
        />
      </div>

      <FinanceTabs active="projects" />

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Receitas · {year}
              </p>
              <p className="mt-1 truncate text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(yearIncomeCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {projects.length}{' '}
                {projects.length === 1 ? 'projeto' : 'projetos'} ·{' '}
                {yearEntryCount}{' '}
                {yearEntryCount === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>
            <div className="sm:border-l sm:pl-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Despesas · {year}
              </p>
              <p className="mt-1 truncate text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {formatMoney(yearExpenseCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {yearIncomeCents > 0
                  ? `${Math.round((yearExpenseCents / yearIncomeCents) * 100)}% das receitas`
                  : 'Sem receitas no ano'}
              </p>
            </div>
            <div className="sm:border-l sm:pl-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Saldo geral
              </p>
              <p className="mt-1 truncate text-[28px] font-extrabold leading-tight tracking-tight tabular-nums">
                {formatMoney(yearIncomeCents - yearExpenseCents)}
              </p>
              <p className="text-xs text-muted-foreground">janeiro — {year}</p>
            </div>
          </div>
          {yearTotal > 0 && (
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="bg-emerald-600"
                style={{ width: `${incomeShare}%` }}
              />
              <div
                className="bg-rose-600"
                style={{ width: `${100 - incomeShare}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => {
          const summary = byProject.get(project.id)
          const Icon = KIND_ICONS[project.kind]
          const series = monthlyBalanceSeries(summary?.months ?? [], month)
          const entryCount = summary?.entryCount ?? 0

          return (
            <Link
              key={project.id}
              href={`/dashboard/finances/projects/${project.id}`}
              className="flex flex-col gap-3.5 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${project.color}1f`,
                    color: project.color,
                  }}
                >
                  <Icon className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {project.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {KIND_LABELS[project.kind]} · {entryCount}{' '}
                    {entryCount === 1 ? 'lançamento' : 'lançamentos'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Saldo
                </p>
                <p className="text-2xl font-extrabold tracking-tight tabular-nums">
                  {formatMoney(
                    (summary?.incomeCents ?? 0) - (summary?.expenseCents ?? 0),
                  )}
                </p>
              </div>
              <Sparkline
                values={series}
                color={project.color}
                label={`Saldo mensal de ${project.name} nos últimos 5 meses`}
              />
              <div className="flex justify-between border-t pt-3 text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  + {formatMoney(summary?.incomeCents ?? 0)}
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  − {formatMoney(summary?.expenseCents ?? 0)}
                </span>
              </div>
            </Link>
          )
        })}

        <NewProjectDialog
          trigger={
            <button
              type="button"
              className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Plus className="size-4" />
              </span>
              <span className="text-sm font-medium">Novo projeto</span>
            </button>
          }
        />
      </div>
    </div>
  )
}
