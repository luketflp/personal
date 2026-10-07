import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { documentLine } from '@/lib/contracts/document'
import type { Contract } from '@/lib/db/schema'
import { formatTimestamp } from '@/lib/format'

export function EvidencePanel({ contract }: { contract: Contract }) {
  const rows: [string, string][] = [
    ['Assinado por', contract.signerName ?? '—'],
    [
      'Documento',
      documentLine(contract.signerDocumentType, contract.signerDocument) || '—',
    ],
    ['Endereço', contract.signerAddress ?? '—'],
    ['Assinado em', formatTimestamp(contract.signedAt) || '—'],
    ['Enviado em', formatTimestamp(contract.sentAt) || '—'],
    ['IP', contract.signerIp ?? '—'],
    ['Navegador', contract.signerUserAgent ?? '—'],
  ]

  return (
    <Card className="border-emerald-200">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <ShieldCheck className="size-5 text-emerald-700" />
        <CardTitle className="text-base">Registro da assinatura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-lg bg-slate-900 px-4 py-3 text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            SHA-256
          </p>
          <code className="mt-1 block break-all font-contract-mono text-xs">
            {contract.signedHash}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
