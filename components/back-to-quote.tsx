'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import type { Language } from '@/lib/i18n/dictionaries'

const LABELS: Record<Language, string> = {
  pt: 'Voltar ao orçamento',
  en: 'Back to quote',
  es: 'Volver al presupuesto',
}

// Shown when the visitor arrived from a public quote (/?q=<slug>).
export function BackToQuote({ language }: { language: Language }) {
  const searchParams = useSearchParams()
  const slug = searchParams.get('q')
  if (!slug || !/^[\w-]{6,32}$/.test(slug)) return null

  return (
    <div className="sticky top-16 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-2">
        <Link
          href={`/q/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          <FileText className="size-4" />
          {LABELS[language]}
        </Link>
      </div>
    </div>
  )
}
