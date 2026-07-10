import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestActions } from '@/components/quotes/request-actions-buttons'
import { formatDatePtBR } from '@/lib/format'
import { listRequests } from '@/lib/quotes/request-queries'
import type { RequestStatus } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

const STATUS: Record<
  RequestStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  new: { label: 'Nova', variant: 'secondary' },
  accepted: { label: 'Convertida', variant: 'default' },
  declined: { label: 'Arquivada', variant: 'outline' },
}

export default async function RequestsPage() {
  const requests = await listRequests()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Mensagens</h2>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Elas aparecem aqui quando alguém envia o
            formulário de contato.
          </CardContent>
        </Card>
      ) : (
        requests.map(request => {
          const status = STATUS[request.status]
          return (
            <Card key={request.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">{request.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {request.email}
                    {request.phone ? ` · ${request.phone}` : ''}
                    {request.company ? ` · ${request.company}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDatePtBR(request.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-line text-sm">{request.message}</p>
                {(request.budget || request.deadline) && (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    {request.budget && <span>Orçamento: {request.budget}</span>}
                    {request.deadline && <span>Prazo: {request.deadline}</span>}
                  </div>
                )}
                {request.status === 'new' && <RequestActions id={request.id} />}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
