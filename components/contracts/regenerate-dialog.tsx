'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { regenerateContract } from '@/lib/contracts/actions'
import { QUOTE_LANGUAGE_LABELS } from '@/lib/quotes/language'
import { LANGUAGES, type QuoteLanguage } from '@/lib/quotes/validation'

export function RegenerateDialog({
  id,
  language,
}: {
  id: string
  language: QuoteLanguage
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<QuoteLanguage>(language)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RotateCcw className="size-4" /> Regenerar do modelo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerar do modelo?</DialogTitle>
          <DialogDescription>
            O texto volta ao modelo padrão com os dados atuais do orçamento.
            Suas edições serão perdidas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="regenerate-language">Idioma</Label>
          <Select
            value={lang}
            onValueChange={value => setLang(value as QuoteLanguage)}
          >
            <SelectTrigger id="regenerate-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => (
                <SelectItem key={l} value={l}>
                  {QUOTE_LANGUAGE_LABELS[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await regenerateContract(id, lang)
                if (!res.ok) {
                  toast.error(res.error)
                  return
                }
                toast.success('Contrato regenerado')
                setOpen(false)
                router.refresh()
              })
            }
          >
            Regenerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
