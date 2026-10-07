'use client'

import { Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({
  slug,
  base = '/q',
  label = 'Copiar link público',
  iconOnly = false,
  size = 'default',
}: {
  slug: string
  base?: '/q' | '/c'
  label?: string
  iconOnly?: boolean
  size?: 'sm' | 'default'
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${base}/${slug}`,
      )
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  if (iconOnly) {
    return (
      <Button variant="ghost" size="icon" aria-label={label} onClick={copy}>
        <Link2 className="size-4" />
      </Button>
    )
  }
  return (
    <Button variant="outline" size={size} className="gap-2" onClick={copy}>
      <Copy className="size-4" /> {label}
    </Button>
  )
}
