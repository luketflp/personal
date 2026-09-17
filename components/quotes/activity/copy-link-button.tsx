'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({ slug }: { slug: string }) {
  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}/q/${slug}`,
          )
          toast.success('Link copiado')
        } catch {
          toast.error('Não foi possível copiar o link')
        }
      }}
    >
      <Copy className="size-4" /> Copiar link público
    </Button>
  )
}
