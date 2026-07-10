import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { ISSUER } from '@/lib/quotes/issuer'
import { quoteLanguage } from '@/lib/quotes/language'
import { getQuoteBySlug } from '@/lib/quotes/queries'
import type { QuoteLanguage } from '@/lib/quotes/validation'

export const size = { width: 1200, height: 630 }
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

  const root = process.cwd()
  const [photo, interRegular, interSemiBold, interBold] = await Promise.all([
    readFile(join(root, 'public/hero-me.png')),
    readFile(join(root, 'assets/fonts/inter/latin-400-normal.ttf')),
    readFile(join(root, 'assets/fonts/inter/latin-600-normal.ttf')),
    readFile(join(root, 'assets/fonts/inter/latin-700-normal.ttf')),
  ])
  const photoSrc = `data:image/png;base64,${photo.toString('base64')}`

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: 'Inter',
        background:
          'linear-gradient(135deg, #ffffff 0%, #eef2f7 55%, #dde5ee 100%)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 72,
          paddingRight: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: -2,
          }}
        >
          {ISSUER.name}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 14,
            paddingTop: 16,
            borderTop: '2px solid #cbd5e1',
            fontSize: 30,
            color: '#334155',
          }}
        >
          {ISSUER.title[lang]}
        </div>
        {quote && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 72,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                textTransform: 'uppercase',
                letterSpacing: 8,
                color: '#64748b',
              }}
            >
              {DOCUMENT[lang]}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 10,
                fontSize: 38,
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              {`${PREPARED_FOR[lang]} ${quote.customerName}`}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          paddingRight: 56,
        }}
      >
        <img
          src={photoSrc}
          width={444}
          height={592}
          style={{ objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
        { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' },
        { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
      ],
    },
  )
}
