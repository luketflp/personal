import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate, formatMoney } from '@/lib/format'
import {
  financeTotals,
  formatMonth,
  summarizeFinancesByMonth,
} from '@/lib/finances/math'
import { getProject, listProjectEntries } from '@/lib/finances/queries'

import type { ProjectKind } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

const KIND_LABELS: Record<ProjectKind, string> = {
  passeio: 'Passeio',
  servico: 'Serviço',
  outro: 'Projeto',
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const project = await getProject(id)
  if (!project) notFound()

  const entries = await listProjectEntries(id)
  const totals = financeTotals(entries)
  const months = summarizeFinancesByMonth(entries)
  const firstMonth = months.at(-1)?.month
  const flowTotal = totals.incomeCents + totals.expenseCents
  const incomeShare = flowTotal ? (totals.incomeCents / flowTotal) * 100 : 0
  const incomeCount = entries.filter(entry => entry.type === 'income').length

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/finances/projects"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> Projetos
      </Link>

      <div>
        <div className="flex items-center gap-2.5">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {KIND_LABELS[project.kind]}
          {firstMonth &&
            ` · desde ${formatMonth(firstMonth).toLocaleLowerCase('pt-BR')}`}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Receitas · histórico
              </p>
              <p className="mt-1 truncate text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(totals.incomeCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {incomeCount} {incomeCount === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>
            <div className="sm:border-l sm:pl-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Despesas · histórico
              </p>
              <p className="mt-1 truncate text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {formatMoney(totals.expenseCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {entries.length - incomeCount}{' '}
                {entries.length - incomeCount === 1
                  ? 'lançamento'
                  : 'lançamentos'}
              </p>
            </div>
            <div className="sm:border-l sm:pl-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Saldo do projeto
              </p>
              <p className="mt-1 truncate text-[28px] font-extrabold leading-tight tracking-tight tabular-nums">
                {formatMoney(totals.balanceCents)}
              </p>
            </div>
          </div>
          {flowTotal > 0 && (
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

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-base">Lançamentos</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {entries.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              somente deste projeto
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {entries.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                Nenhum lançamento ainda. Adicione na aba Visão mensal.
              </p>
            ) : (
              months.map(month => (
                <div key={month.month}>
                  <div className="px-6 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatMonth(month.month)}
                  </div>
                  {entries
                    .filter(entry => entry.occurredOn.startsWith(month.month))
                    .map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 px-6 py-2.5"
                      >
                        <div
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-full',
                            entry.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
                          )}
                        >
                          {entry.type === 'income' ? (
                            <ArrowUpRight className="size-4" />
                          ) : (
                            <ArrowDownLeft className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {entry.description ||
                              (entry.type === 'income'
                                ? 'Receita'
                                : 'Despesa')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.occurredOn, 'pt-BR', 'medium')}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'whitespace-nowrap text-sm font-semibold tabular-nums',
                            entry.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {entry.type === 'income' ? '+' : '-'}{' '}
                          {formatMoney(entry.amountCents)}
                        </span>
                      </div>
                    ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-base">Histórico mensal</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {months.map(month => (
              <div
                key={month.month}
                className="space-y-1 border-t px-6 py-3 first:border-t-0"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">
                    {formatMonth(month.month)}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      month.balanceCents < 0 &&
                        'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {formatMoney(month.balanceCents)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    + {formatMoney(month.incomeCents)}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    − {formatMoney(month.expenseCents)}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t bg-muted/50 px-6 py-3.5">
              <span className="text-sm font-semibold">Saldo histórico</span>
              <span className="text-base font-extrabold tabular-nums">
                {formatMoney(totals.balanceCents)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
