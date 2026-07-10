'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Archive, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptRequest, declineRequest } from '@/lib/quotes/request-actions'

export function RequestActions({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="gap-1"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await acceptRequest(id)
            if (!res.ok || !res.quoteId) {
              toast.error('Não foi possível criar o orçamento')
              return
            }
            toast.success('Rascunho de orçamento criado')
            router.push(`/dashboard/${res.quoteId}/edit`)
          })
        }
      >
        <FileText className="size-4" /> Criar orçamento
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await declineRequest(id)
            toast.success('Mensagem arquivada')
            router.refresh()
          })
        }
      >
        <Archive className="size-4" /> Arquivar
      </Button>
    </div>
  )
}
