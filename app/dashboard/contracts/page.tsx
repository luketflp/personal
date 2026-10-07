import Link from 'next/link'
import {
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileEdit,
  Pencil,
} from 'lucide-react'
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge'
import { GenerateContractButton } from '@/components/contracts/generate-contract-button'
import { StatCard } from '@/components/dashboard/stat-card'
import { CopyLinkButton } from '@/components/quotes/activity/copy-link-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { contractFonts } from '@/lib/contracts/fonts'
import {
  type ContractFilter,
  contractStats,
  listContracts,
  listQuotesWithoutContract,
} from '@/lib/contracts/queries'
import { formatMoney, formatTimestamp } from '@/lib/format'
import {
  QUOTE_LANGUAGE_LABELS,
  quoteLanguage,
  quoteLocale,
} from '@/lib/quotes/language'
import { computeTotals } from '@/lib/quotes/totals'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const FILTERS: { key?: ContractFilter; label: string; href: string }[] = [
  { label: 'Todos', href: '/dashboard/contracts' },
  { key: 'open', label: 'Abertos', href: '/dashboard/contracts?status=open' },
  { key: 'signed', label: 'Assinados', href: '/dashboard/contracts?status=signed' },
]

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter =
    status === 'open' || status === 'signed' ? status : undefined
  const [rows, pending, stats] = await Promise.all([
    listContracts(filter),
    listQuotesWithoutContract(),
    contractStats(),
  ])
  const signedValue =
    stats.signedTotals
      .map(s => formatMoney(s.totalCents, s.currency, 'pt-BR'))
      .join(' · ') || '—'

  return (
    <div className={cn(contractFonts, 'space-y-6')}>
      <div>
        <p className="font-contract-mono text-xs text-muted-foreground">
          &gt; contratos
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight">
          Contratos
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Gerados a partir de orçamentos aceitos. O cliente assina pelo link.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rascunhos" value={stats.counts.draft} icon={FileEdit} />
        <StatCard
          label="Aguardando assinatura"
          value={stats.counts.sent}
          icon={Clock}
        />
        <StatCard
          label="Assinados"
          value={stats.counts.signed}
          icon={CheckCircle2}
        />
        <StatCard
          label="Valor assinado no ano"
          value={signedValue}
          icon={Banknote}
        />
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <span className="size-2 rounded-full bg-orange-600" aria-hidden />
              Orçamentos aceitos sem contrato
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {pending.length} pronto{pending.length > 1 ? 's' : ''} para gerar
            </span>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {pending.map(quote => {
              const lang = quoteLanguage(quote.language)
              const { totalCents } = computeTotals(
                quote.items,
                quote.discountCents,
              )
              return (
                <div
                  key={quote.id}
                  className="flex flex-wrap items-center gap-4 px-6 py-3.5"
                >
                  <span className="min-w-[6.5rem] font-contract-mono text-[13px] text-slate-600">
                    {quote.code}
                  </span>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-sm font-medium">{quote.customerName}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {[quote.customerCompany, QUOTE_LANGUAGE_LABELS[lang]]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(totalCents, quote.currency, quoteLocale(lang))}
                  </span>
                  <GenerateContractButton quoteId={quote.id} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Todos os contratos</CardTitle>
          <nav
            aria-label="Filtrar por status"
            className="inline-flex gap-0.5 rounded-lg bg-muted p-1"
          >
            {FILTERS.map(f => (
              <Link
                key={f.label}
                href={f.href}
                aria-current={filter === f.key ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium',
                  filter === f.key
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum contrato aqui ainda. Gere um a partir de um orçamento
              aceito.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Assinado</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[8rem] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(contract => {
                  const lang = quoteLanguage(contract.language)
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="whitespace-nowrap font-contract-mono text-[13px]">
                        {contract.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {contract.customerName}
                        </div>
                        {contract.customerCompany && (
                          <div className="text-sm text-muted-foreground">
                            {contract.customerCompany}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <ContractStatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {QUOTE_LANGUAGE_LABELS[lang]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatTimestamp(contract.sentAt, 'pt-BR', false) || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatTimestamp(contract.signedAt, 'pt-BR', false) ||
                          '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                        {formatMoney(
                          contract.totalCents,
                          contract.currency,
                          quoteLocale(lang),
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {contract.status !== 'draft' && (
                            <CopyLinkButton
                              slug={contract.slug}
                              base="/c"
                              label="Copiar link de assinatura"
                              iconOnly
                            />
                          )}
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="Abrir página pública"
                          >
                            <Link href={`/c/${contract.slug}`} target="_blank">
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="Abrir contrato"
                          >
                            <Link href={`/dashboard/contracts/${contract.id}`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
