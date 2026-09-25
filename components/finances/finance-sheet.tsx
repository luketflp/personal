'use client'

import { FormEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatDate, formatMoney } from '@/lib/format'
import {
  createFinanceEntry,
  deleteFinanceEntry,
  updateFinanceEntry,
} from '@/lib/finances/actions'
import { FinanceTabs } from '@/components/finances/finance-tabs'
import {
  financeTotals,
  formatMonth,
  summarizeFinancesByProject,
} from '@/lib/finances/math'

import type { FinanceEntryType } from '@/lib/db/schema'
import type { FinanceEntryInput } from '@/lib/finances/validation'

export type FinanceEntryRow = {
  id: string
  type: FinanceEntryType
  occurredOn: string
  projectId: string
  projectName: string
  description: string | null
  amountCents: number
}

export type ProjectOption = {
  id: string
  name: string
}

type FinanceForm = {
  type: FinanceEntryType
  occurredOn: string
  projectId: string
  description: string
  amount: string
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function today() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function emptyForm(
  month: string,
  projectId: string,
  type: FinanceEntryType = 'income',
): FinanceForm {
  const currentDate = today()
  return {
    type,
    occurredOn: currentDate.startsWith(month) ? currentDate : `${month}-01`,
    projectId,
    description: '',
    amount: '',
  }
}

function parseAmount(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

function formatAmount(cents: number) {
  return currencyFormatter.format(cents / 100)
}

function entriesToCsv(entries: FinanceEntryRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const rows = [
    ['Data', 'Tipo', 'Projeto', 'Descrição', 'Valor'],
    ...entries.map(entry => [
      formatDate(entry.occurredOn, 'pt-BR', 'medium'),
      entry.type === 'income' ? 'Receita' : 'Despesa',
      entry.projectName,
      entry.description ?? '',
      (entry.amountCents / 100).toFixed(2).replace('.', ','),
    ]),
  ]

  return rows.map(row => row.map(escape).join(';')).join('\n')
}

export function FinanceSheet({
  entries,
  projects,
  month,
}: {
  entries: FinanceEntryRow[]
  projects: ProjectOption[]
  month: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FinanceEntryRow | null>(null)
  const defaultProjectId = projects[0]?.id ?? ''
  const [form, setForm] = useState<FinanceForm>(() =>
    emptyForm(month, defaultProjectId),
  )
  const [error, setError] = useState('')

  const totals = useMemo(() => financeTotals(entries), [entries])
  const summaries = useMemo(
    () => summarizeFinancesByProject(entries),
    [entries],
  )
  const incomeCount = entries.filter(entry => entry.type === 'income').length
  const expenseCount = entries.length - incomeCount

  function openCreate(type: FinanceEntryType = 'income') {
    setEditingEntry(null)
    setForm(emptyForm(month, defaultProjectId, type))
    setError('')
    setDialogOpen(true)
  }

  function openEdit(entry: FinanceEntryRow) {
    setEditingEntry(entry)
    setForm({
      type: entry.type,
      occurredOn: entry.occurredOn,
      projectId: entry.projectId,
      description: entry.description ?? '',
      amount: formatAmount(entry.amountCents),
    })
    setError('')
    setDialogOpen(true)
  }

  function closeDialog() {
    if (isPending) return
    setDialogOpen(false)
    setEditingEntry(null)
    setError('')
  }

  function changeMonth(nextMonth: string) {
    if (!/^\d{4}-\d{2}$/.test(nextMonth)) return
    router.replace(`/dashboard/finances?month=${nextMonth}`)
  }

  function changeAmount(value: string) {
    const cents = parseAmount(value)
    setForm(current => ({
      ...current,
      amount: cents ? formatAmount(cents) : '',
    }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amountCents = parseAmount(form.amount)

    if (!form.occurredOn || !form.projectId || amountCents <= 0) {
      setError('Preencha a data, o projeto e um valor maior que zero.')
      return
    }

    const input: FinanceEntryInput = {
      type: form.type,
      occurredOn: form.occurredOn,
      projectId: form.projectId,
      description: form.description.trim(),
      amountCents,
    }

    setError('')
    startTransition(async () => {
      const result = editingEntry
        ? await updateFinanceEntry(editingEntry.id, input)
        : await createFinanceEntry(input)

      if (!result.ok) {
        setError(result.error)
        return
      }

      const savedMonth = form.occurredOn.slice(0, 7)
      toast.success(
        editingEntry ? 'Lançamento atualizado' : 'Lançamento adicionado',
      )
      setDialogOpen(false)
      setEditingEntry(null)

      if (savedMonth !== month) {
        router.replace(`/dashboard/finances?month=${savedMonth}`)
      } else {
        router.refresh()
      }
    })
  }

  function remove(entry: FinanceEntryRow) {
    startTransition(async () => {
      const result = await deleteFinanceEntry(entry.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Lançamento excluído')
      router.refresh()
    })
  }

  function downloadCsv() {
    if (!entries.length) return

    const blob = new Blob([`\uFEFF${entriesToCsv(entries)}`], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `controle-financeiro-${month}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Receitas e despesas dos projetos organizadas por mês.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-40 flex-1 sm:flex-none">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="month"
              value={month}
              onChange={event => changeMonth(event.target.value)}
              className="pl-9"
              aria-label="Mês de referência"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={downloadCsv}
            disabled={!entries.length}
            aria-label="Baixar planilha CSV"
            title="Baixar planilha CSV"
          >
            <Download className="size-4" />
          </Button>
          <Button
            onClick={() => openCreate()}
            className="flex-1 gap-2 sm:flex-none"
          >
            <Plus className="size-4" /> Novo lançamento
          </Button>
        </div>
      </div>

      <FinanceTabs active="month" />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Receitas"
          value={totals.incomeCents}
          detail={`${incomeCount} ${incomeCount === 1 ? 'lançamento' : 'lançamentos'}`}
          icon={ArrowUpRight}
          tone="positive"
        />
        <SummaryCard
          label="Despesas"
          value={totals.expenseCents}
          detail={`${expenseCount} ${expenseCount === 1 ? 'lançamento' : 'lançamentos'}`}
          icon={ArrowDownLeft}
          tone="negative"
        />
        <SummaryCard
          label="Saldo do mês"
          value={totals.balanceCents}
          detail={formatMonth(month)}
          icon={TrendingUp}
          tone={totals.balanceCents < 0 ? 'negative' : 'neutral'}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Resultado por projeto</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMonth(month)}
            </p>
          </div>
          <WalletCards className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          {summaries.length === 0 ? (
            <EmptyState onAdd={() => openCreate()} />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[42rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map(summary => (
                    <TableRow key={summary.projectId}>
                      <TableCell>
                        <div className="font-medium">{summary.projectName}</div>
                        <div className="text-xs text-muted-foreground">
                          {summary.entryCount}{' '}
                          {summary.entryCount === 1
                            ? 'lançamento'
                            : 'lançamentos'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatMoney(summary.incomeCents)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-rose-600 dark:text-rose-400">
                        {formatMoney(summary.expenseCents)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold tabular-nums',
                          summary.balanceCents < 0 &&
                            'text-rose-600 dark:text-rose-400',
                        )}
                      >
                        {formatMoney(summary.balanceCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Total do mês</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(totals.incomeCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                      {formatMoney(totals.expenseCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(totals.balanceCents)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Lançamentos do mês</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Edite ou exclua cada registro quando precisar.
              </p>
            </div>
            <ReceiptText className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center gap-3 px-6 py-3.5"
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
                  <div className="min-w-44 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{entry.projectName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.occurredOn, 'pt-BR', 'medium')}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.description ||
                        (entry.type === 'income' ? 'Receita' : 'Despesa')}
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
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(entry)}
                      aria-label={`Editar lançamento de ${entry.projectName}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir lançamento de ${entry.projectName}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Excluir lançamento?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            O registro de {formatMoney(entry.amountCents)} para{' '}
                            {entry.projectName} será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={isPending}
                            onClick={() => remove(entry)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={open => !open && closeDialog()}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Editar lançamento' : 'Novo lançamento'}
              </DialogTitle>
              <DialogDescription>
                Registre um pagamento recebido ou um gasto do projeto.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-5">
              <div className="grid grid-cols-2 gap-2">
                <TypeButton
                  type="income"
                  active={form.type === 'income'}
                  onClick={() =>
                    setForm(current => ({ ...current, type: 'income' }))
                  }
                />
                <TypeButton
                  type="expense"
                  active={form.type === 'expense'}
                  onClick={() =>
                    setForm(current => ({ ...current, type: 'expense' }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="finance-date">Data</Label>
                  <Input
                    id="finance-date"
                    type="date"
                    value={form.occurredOn}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        occurredOn: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="finance-amount">Valor</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="finance-amount"
                      inputMode="numeric"
                      value={form.amount}
                      onChange={event => changeAmount(event.target.value)}
                      className="pl-10 text-right tabular-nums"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="finance-project">Projeto</Label>
                <Select
                  value={form.projectId || undefined}
                  onValueChange={value =>
                    setForm(current => ({ ...current, projectId: value }))
                  }
                >
                  <SelectTrigger id="finance-project">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Crie um projeto na aba Projetos antes de lançar.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="finance-description">Descrição</Label>
                <Input
                  id="finance-description"
                  value={form.description}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder={
                    form.type === 'income'
                      ? 'Ex.: Repasse do passeio'
                      : 'Ex.: Transporte, alimentação, equipamento...'
                  }
                  maxLength={160}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {error}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Salvando...'
                  : editingEntry
                    ? 'Salvar alterações'
                    : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  detail: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            tone === 'positive' &&
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
            tone === 'negative' &&
              'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
            tone === 'neutral' && 'bg-muted text-foreground',
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-xl font-bold tabular-nums">
            {formatMoney(value)}
          </p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TypeButton({
  type,
  active,
  onClick,
}: {
  type: FinanceEntryType
  active: boolean
  onClick: () => void
}) {
  const isIncome = type === 'income'
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        'gap-2',
        active &&
          isIncome &&
          'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
        active &&
          !isIncome &&
          'border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:bg-rose-950 dark:text-rose-400',
      )}
    >
      {isIncome ? (
        <ArrowUpRight className="size-4" />
      ) : (
        <ArrowDownLeft className="size-4" />
      )}
      {isIncome ? 'Receita' : 'Despesa'}
    </Button>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted">
        <FileSpreadsheet className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold">Nenhum lançamento neste mês</h3>
      <p className="mb-4 mt-1 max-w-sm text-sm text-muted-foreground">
        Adicione o primeiro recebimento ou gasto para acompanhar o resultado dos
        passeios.
      </p>
      <Button size="sm" onClick={onAdd} className="gap-2">
        <Plus className="size-4" /> Adicionar lançamento
      </Button>
    </div>
  )
}
