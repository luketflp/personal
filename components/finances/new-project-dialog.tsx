'use client'

import { FormEvent, ReactNode, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createProject } from '@/lib/finances/actions'
import { PROJECT_COLORS } from '@/lib/finances/validation'

import type { ProjectKind } from '@/lib/db/schema'

const KINDS: { value: ProjectKind; label: string }[] = [
  { value: 'passeio', label: 'Passeio' },
  { value: 'servico', label: 'Serviço' },
  { value: 'outro', label: 'Outro' },
]

const COLOR_LABELS = ['Verde', 'Azul', 'Violeta', 'Âmbar', 'Rosa', 'Cinza']

export function NewProjectDialog({ trigger }: { trigger: ReactNode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ProjectKind>('passeio')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0])
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Informe o nome do projeto.')
      return
    }

    setError('')
    startTransition(async () => {
      const result = await createProject({ name: name.trim(), kind, color })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Projeto criado')
      setOpen(false)
      setName('')
      setKind('passeio')
      setColor(PROJECT_COLORS[0])
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={next => !isPending && setOpen(next)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
            <DialogDescription>
              Organize receitas e despesas por passeio ou serviço.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Nome</Label>
              <Input
                id="project-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Ex.: Rio da Prata"
                maxLength={100}
                autoComplete="off"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-3 gap-2">
                {KINDS.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    onClick={() => setKind(option.value)}
                    className={cn(
                      option.value === kind &&
                        'border-foreground bg-muted font-semibold',
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex gap-2.5">
                {PROJECT_COLORS.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    aria-label={COLOR_LABELS[index]}
                    onClick={() => setColor(option)}
                    className={cn(
                      'size-7 rounded-full border-2 border-background',
                      option === color
                        ? 'outline outline-2 outline-foreground'
                        : 'outline outline-2 outline-transparent',
                    )}
                    style={{ backgroundColor: option }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Criando...' : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
