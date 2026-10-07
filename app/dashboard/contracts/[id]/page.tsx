import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
import { ContractBody } from '@/components/contracts/contract-body'
import { ContractEditor } from '@/components/contracts/contract-editor'
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge'
import { EvidencePanel } from '@/components/contracts/evidence-panel'
import { RegenerateDialog } from '@/components/contracts/regenerate-dialog'
import { VoidContractButton } from '@/components/contracts/void-contract-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { contractFonts } from '@/lib/contracts/fonts'
import { getContractById } from '@/lib/contracts/queries'
import { isEditable } from '@/lib/contracts/status'
import { CONTRACT_TITLES } from '@/lib/contracts/template'
import { formatMoney } from '@/lib/format'
import {
  QUOTE_LANGUAGE_LABELS,
  quoteLanguage,
  quoteLocale,
} from '@/lib/quotes/language'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const contract = await getContractById(id)
  if (!contract) notFound()

  const lang = quoteLanguage(contract.language)
  const editable = isEditable(contract.status)
  const title = CONTRACT_TITLES[lang]
  const meta = [
    {
      label: 'Orçamento',
      value: contract.quoteId ? (
        <Link
          href={`/dashboard/${contract.quoteId}`}
          className="font-contract-mono text-[13px] underline-offset-4 hover:underline"
        >
          {contract.quoteCode}
        </Link>
      ) : (
        <span className="font-contract-mono text-[13px]">
          {contract.quoteCode ?? '—'}
        </span>
      ),
    },
    {
      label: 'Valor',
      value: formatMoney(contract.totalCents, contract.currency, quoteLocale(lang)),
    },
    { label: 'Idioma', value: QUOTE_LANGUAGE_LABELS[lang] },
    {
      label: 'Contratante',
      value: contract.signerName ?? 'Preenchido na assinatura',
    },
  ]

  return (
    <div className={cn(contractFonts, 'space-y-5')}>
      <Link
        href="/dashboard/contracts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Contratos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-contract-mono text-xl font-medium tracking-tight">
              {contract.code}
            </h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {[contract.customerName, contract.customerCompany]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <VoidContractButton id={contract.id} code={contract.code} />
          )}
          {editable && <RegenerateDialog id={contract.id} language={lang} />}
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/c/${contract.slug}`} target="_blank">
              <Eye className="size-4" /> Visualizar
            </Link>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
        {meta.map(m => (
          <div key={m.label} className="bg-background px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {m.label}
            </dt>
            <dd className="mt-1 text-sm font-medium">{m.value}</dd>
          </div>
        ))}
      </dl>

      {editable ? (
        <ContractEditor
          id={contract.id}
          slug={contract.slug}
          code={contract.code}
          status={contract.status}
          title={title}
          initialBody={contract.body}
        />
      ) : (
        <>
          {contract.status === 'signed' && <EvidencePanel contract={contract} />}
          <Card className="px-6 py-8 sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contrato · {contract.code}
            </p>
            <h2 className="mb-6 mt-2 font-contract-serif text-2xl font-bold leading-tight text-slate-900">
              {title}
            </h2>
            <ContractBody body={contract.body} />
          </Card>
        </>
      )}
    </div>
  )
}
