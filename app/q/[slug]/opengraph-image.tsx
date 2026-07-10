import { ImageResponse } from 'next/og'
import { OG_SIZE, OgCard, loadOgAssets } from '@/lib/og/card'
import { ISSUER } from '@/lib/quotes/issuer'
import { quoteLanguage } from '@/lib/quotes/language'
import { getQuoteBySlug } from '@/lib/quotes/queries'
import type { QuoteLanguage } from '@/lib/quotes/validation'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Lucas Alexander'

const DOCUMENT: Record<QuoteLanguage, string> = {
  pt: 'Orçamento',
  en: 'Quote',
  es: 'Presupuesto',
}

const PREPARED_FOR: Record<QuoteLanguage, string> = {
  pt: 'Preparado para',
  en: 'Prepared for',
  es: 'Preparado para',
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const quote = await getQuoteBySlug(slug)
  const lang = quoteLanguage(quote?.language)
  const { photoSrc, fonts } = await loadOgAssets()

  return new ImageResponse(
    <OgCard
      photoSrc={photoSrc}
      name={ISSUER.name}
      subtitle={ISSUER.title[lang]}
      label={quote ? DOCUMENT[lang] : undefined}
      headline={
        quote ? `${PREPARED_FOR[lang]} ${quote.customerName}` : undefined
      }
    />,
    { ...OG_SIZE, fonts },
  )
}
