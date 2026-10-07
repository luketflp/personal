'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileSignature } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createContractFromQuote } from '@/lib/contracts/actions'

export function GenerateContractButton({
  quoteId,
  variant = 'default',
}: {
  quoteId: string
  variant?: 'default' | 'outline'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant={variant}
      className="gap-2"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await createContractFromQuote(quoteId)
          if (!res.ok) {
            toast.error(res.error)
            return
          }
          toast.success('Contrato criado')
          router.push(`/dashboard/contracts/${res.id}`)
        })
      }
    >
      <FileSignature className="size-4" /> Gerar contrato
    </Button>
  )
}
