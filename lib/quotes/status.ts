import type { QuoteStatus } from '@/lib/db/schema'

export const QUOTE_STATUS_BADGES: Record<
  QuoteStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  sent: { label: 'Enviado', variant: 'secondary' },
  accepted: { label: 'Aceito', variant: 'default' },
  declined: { label: 'Recusado', variant: 'destructive' },
}
