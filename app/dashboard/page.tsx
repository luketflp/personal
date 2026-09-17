import Link from 'next/link'
import {
  CheckCircle2,
  ExternalLink,
  FileEdit,
  FileText,
  Pencil,
  Plus,
  Send,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityCell } from '@/components/quotes/activity/activity-cell'
import { Badge } from '@/components/ui/badge'
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
import { DeleteQuoteButton } from '@/components/quotes/delete-quote-button'
import { formatDate, formatMoney } from '@/lib/format'
import { listActivitySummaries } from '@/lib/quotes/event-queries'
import {
  QUOTE_LANGUAGE_LABELS,
  quoteLanguage,
  quoteLocale,
} from '@/lib/quotes/language'
import { listQuotes } from '@/lib/quotes/queries'
import { QUOTE_STATUS_BADGES } from '@/lib/quotes/status'
import { computeTotals } from '@/lib/quotes/totals'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [quotes, activity] = await Promise.all([
    listQuotes(),
    listActivitySummaries(),
  ])
  const now = new Date()
  const counts = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={counts.total} icon={FileText} />
        <StatCard label="Rascunhos" value={counts.draft} icon={FileEdit} />
        <StatCard label="Enviados" value={counts.sent} icon={Send} />
        <StatCard label="Aceitos" value={counts.accepted} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Todos os orçamentos</CardTitle>
          <Button asChild size="sm" className="gap-2">
            <Link href="/dashboard/new">
              <Plus className="size-4" /> Novo orçamento
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum orçamento ainda. Clique em “Novo orçamento” para criar o
              primeiro.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[8rem] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map(quote => {
                  const { totalCents } = computeTotals(
                    quote.items,
                    quote.discountCents,
                  )
                  const status = QUOTE_STATUS_BADGES[quote.status]
                  const language = quoteLanguage(quote.language)
                  const locale = quoteLocale(language)
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="whitespace-nowrap font-medium tabular-nums">
                        {quote.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{quote.customerName}</div>
                        {quote.customerCompany && (
                          <div className="text-sm text-muted-foreground">
                            {quote.customerCompany}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <ActivityCell
                          quoteId={quote.id}
                          status={quote.status}
                          summary={activity.get(quote.id)}
                          now={now}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {QUOTE_LANGUAGE_LABELS[language]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(quote.issueDate, locale, 'medium')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                        {formatMoney(totalCents, quote.currency, locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="Abrir orçamento público"
                          >
                            <Link href={`/q/${quote.slug}`} target="_blank">
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="Editar orçamento"
                          >
                            <Link href={`/dashboard/${quote.id}/edit`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <DeleteQuoteButton
                            id={quote.id}
                            label={quote.customerName}
                          />
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
