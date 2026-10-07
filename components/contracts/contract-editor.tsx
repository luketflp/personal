'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Send } from 'lucide-react'
import { toast } from 'sonner'
import { ContractBody } from '@/components/contracts/contract-body'
import { CopyLinkButton } from '@/components/quotes/activity/copy-link-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sendContract, updateContractBody } from '@/lib/contracts/actions'
import type { ContractStatus } from '@/lib/db/schema'

export function ContractEditor({
  id,
  slug,
  code,
  status,
  title,
  initialBody,
}: {
  id: string
  slug: string
  code: string
  status: ContractStatus
  title: string
  initialBody: string
}) {
  const router = useRouter()
  const [body, setBody] = useState(initialBody)
  const [savedBody, setSavedBody] = useState(initialBody)
  const [isPending, startTransition] = useTransition()
  const dirty = body !== savedBody

  // A regenerate replaces the server body; adopt it.
  useEffect(() => {
    setBody(initialBody)
    setSavedBody(initialBody)
  }, [initialBody])

  // Don't lose typed clauses to an accidental tab close.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = async () => {
    const res = await updateContractBody(id, body)
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    setSavedBody(body)
    return true
  }

  const onSave = () =>
    startTransition(async () => {
      if (await save()) {
        toast.success('Contrato salvo')
        router.refresh()
      }
    })

  const onSend = () =>
    startTransition(async () => {
      if (dirty && !(await save())) return
      const res = await sendContract(id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/c/${res.slug}`,
        )
        toast.success('Contrato enviado. Link copiado.')
      } catch {
        toast.success('Contrato enviado. Use “Copiar link” para compartilhar.')
      }
      router.refresh()
    })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="mr-auto text-xs text-muted-foreground">
          {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!dirty || isPending}
          onClick={onSave}
        >
          Salvar
        </Button>
        {status === 'draft' ? (
          <Button
            size="sm"
            className="gap-2"
            disabled={isPending}
            onClick={onSend}
          >
            <Send className="size-4" /> Enviar para assinatura
          </Button>
        ) : (
          <CopyLinkButton slug={slug} base="/c" label="Copiar link" size="sm" />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col overflow-hidden">
          <div className="flex h-11 items-center border-b px-4">
            <Label htmlFor="contract-body" className="text-[13px]">
              Texto do contrato{' '}
              <span className="font-normal text-muted-foreground">
                · markdown
              </span>
            </Label>
          </div>
          <Textarea
            id="contract-body"
            value={body}
            onChange={e => setBody(e.target.value)}
            spellCheck={false}
            className="min-h-[640px] flex-1 resize-y rounded-none border-0 font-contract-mono text-[13px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <p className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Partes e bloco de assinatura são gerados automaticamente; não
            precisam estar no texto.
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex h-11 items-center justify-between border-b px-4">
            <h2 className="text-[13px] font-semibold">Pré-visualização</h2>
            <span className="text-xs text-muted-foreground">
              como o cliente verá
            </span>
          </div>
          <article className="px-6 py-7 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contrato · {code}
            </p>
            <h3 className="mb-5 mt-2 font-contract-serif text-[22px] font-bold leading-tight text-slate-900">
              {title}
            </h3>
            <ContractBody body={body} />
          </article>
        </Card>
      </div>
    </div>
  )
}
