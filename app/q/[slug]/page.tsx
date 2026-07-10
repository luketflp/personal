import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Markdown } from '@/components/quotes/markdown'
import { PrintButton } from '@/components/quotes/print-button'
import { LANGUAGE_LOCALES, formatDate, formatMoney } from '@/lib/format'
import { ISSUER } from '@/lib/quotes/issuer'
import { quoteLanguage } from '@/lib/quotes/language'
import { getQuoteBySlug } from '@/lib/quotes/queries'
import { computeTotals } from '@/lib/quotes/totals'
import type { QuoteLanguage } from '@/lib/quotes/validation'

export const dynamic = 'force-dynamic'

const LABELS: Record<
  QuoteLanguage,
  {
    document: string
    notFound: string
    issued: string
    validUntil: string
    to: string
    scope: string
    description: string
    qty: string
    unitPrice: string
    lineTotal: string
    subtotal: string
    discount: string
    total: string
    delivery: string
    payment: string
    expired: string
    about: string
    notes: string
    terms: string
    print: string
  }
> = {
  pt: {
    document: 'Orçamento',
    notFound: 'Orçamento não encontrado',
    issued: 'Emissão',
    validUntil: 'Válido até',
    to: 'Para',
    scope: 'Escopo do trabalho',
    description: 'Descrição',
    qty: 'Qtd.',
    unitPrice: 'Valor unit.',
    lineTotal: 'Total',
    subtotal: 'Subtotal',
    discount: 'Desconto',
    total: 'Total',
    delivery: 'Prazo de entrega',
    payment: 'Pagamento',
    expired: 'Este orçamento expirou',
    about: 'Conheça mais sobre meu trabalho',
    notes: 'Observações',
    terms: 'Termos',
    print: 'Imprimir / Salvar PDF',
  },
  en: {
    document: 'Quote',
    notFound: 'Quote not found',
    issued: 'Issued',
    validUntil: 'Valid until',
    to: 'To',
    scope: 'Scope of work',
    description: 'Description',
    qty: 'Qty.',
    unitPrice: 'Unit price',
    lineTotal: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    delivery: 'Delivery estimate',
    payment: 'Payment',
    expired: 'This quote has expired',
    about: 'Learn more about my work',
    notes: 'Notes',
    terms: 'Terms',
    print: 'Print / Save PDF',
  },
  es: {
    document: 'Presupuesto',
    notFound: 'Presupuesto no encontrado',
    issued: 'Emisión',
    validUntil: 'Válido hasta',
    to: 'Para',
    scope: 'Alcance del trabajo',
    description: 'Descripción',
    qty: 'Cant.',
    unitPrice: 'Precio unit.',
    lineTotal: 'Total',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    total: 'Total',
    delivery: 'Plazo de entrega',
    payment: 'Pago',
    expired: 'Este presupuesto ha expirado',
    about: 'Conoce más sobre mi trabajo',
    notes: 'Notas',
    terms: 'Términos',
    print: 'Imprimir / Guardar PDF',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const quote = await getQuoteBySlug(slug)
  if (!quote) return { title: LABELS.pt.notFound }
  const lang = quoteLanguage(quote.language)
  const t = LABELS[lang]
  const title = `${t.document} — ${quote.customerName}`
  const description = `${ISSUER.name} · ${ISSUER.title[lang]}`
  return {
    title,
    description,
    robots: { index: false, follow: false },
    // og:image comes from the opengraph-image.tsx file convention.
    openGraph: {
      title,
      description,
      url: `/q/${quote.slug}`,
      siteName: ISSUER.name,
      type: 'website',
      locale: LANGUAGE_LOCALES[lang].replace('-', '_'),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const quote = await getQuoteBySlug(slug)
  if (!quote) notFound()

  const lang = quoteLanguage(quote.language)
  const t = LABELS[lang]
  const locale = LANGUAGE_LOCALES[lang]

  const { subtotalCents, totalCents } = computeTotals(
    quote.items,
    quote.discountCents,
  )
  const money = (cents: number) => formatMoney(cents, quote.currency, locale)

  // End of the valid-until day, local time; accepted quotes don't expire.
  const isExpired =
    quote.status !== 'accepted' &&
    Boolean(quote.validUntil) &&
    new Date(`${quote.validUntil}T23:59:59`) < new Date()

  return (
    <div className="min-h-screen bg-muted/40 py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Link
            href={`/?q=${quote.slug}&lang=${lang}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t.about}
          </Link>
          <PrintButton label={t.print} />
        </div>

        <article className="rounded-xl border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {isExpired && (
            <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {t.expired}
            </div>
          )}
          <header className="grid gap-6 border-b pb-6 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted/40 sm:size-[4.5rem]">
                {/* Full-body cutout: oversize + top-anchor so the crop shows shoulders up */}
                <Image
                  src={ISSUER.photoSrc}
                  alt={ISSUER.name}
                  width={135}
                  height={180}
                  priority
                  className="absolute -top-[18%] left-1/2 h-auto w-[188%] max-w-none -translate-x-1/2"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                  {ISSUER.name}
                </h1>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {ISSUER.title[lang]}
                </p>
                <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                  <p className="break-all">{ISSUER.email}</p>
                  <p className="break-all">
                    <Link
                      href={`/?q=${quote.slug}&lang=${lang}`}
                      className="hover:underline"
                    >
                      {ISSUER.website}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 text-left sm:border-t-0 sm:pt-0 sm:text-right">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t.document}
              </p>
            </div>
          </header>

          <section className="grid gap-x-6 gap-y-4 py-6 sm:grid-cols-2 md:grid-cols-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t.to}
              </p>
              <p className="mt-1 font-medium">{quote.customerName}</p>
              {quote.customerCompany && (
                <p className="text-sm text-muted-foreground">
                  {quote.customerCompany}
                </p>
              )}
              {quote.customerEmail && (
                <p className="break-all text-sm text-muted-foreground">
                  {quote.customerEmail}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t.issued}
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(quote.issueDate, locale)}
              </p>
            </div>
            {quote.validUntil && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t.validUntil}
                </p>
                <p
                  className={`mt-1 text-sm font-medium ${
                    isExpired ? 'text-destructive' : ''
                  }`}
                >
                  {formatDate(quote.validUntil, locale)}
                </p>
              </div>
            )}
            {quote.deliveryEstimate && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t.delivery}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {quote.deliveryEstimate}
                </p>
              </div>
            )}
          </section>

          {quote.scope && (
            <section className="border-t py-6">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                {t.scope}
              </p>
              <Markdown content={quote.scope} />
            </section>
          )}

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y text-left text-muted-foreground">
                <th className="py-2 font-medium">{t.description}</th>
                <th className="py-2 text-right font-medium">{t.qty}</th>
                <th className="py-2 text-right font-medium">{t.unitPrice}</th>
                <th className="py-2 text-right font-medium">{t.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 pr-4 align-top">
                    <div>{item.description}</div>
                    {item.details && (
                      <Markdown
                        content={item.details}
                        className="mt-1 text-muted-foreground"
                      />
                    )}
                  </td>
                  <td className="py-2 text-right align-top tabular-nums">
                    {Number(item.quantity)}
                  </td>
                  <td className="py-2 text-right align-top tabular-nums">
                    {money(item.unitPriceCents)}
                  </td>
                  <td className="py-2 text-right align-top tabular-nums">
                    {money(
                      Math.round(Number(item.quantity) * item.unitPriceCents),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <dl className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.subtotal}</dt>
                <dd className="tabular-nums">{money(subtotalCents)}</dd>
              </div>
              {quote.discountCents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.discount}</dt>
                  <dd className="tabular-nums">
                    −{money(quote.discountCents)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>{t.total}</dt>
                <dd className="tabular-nums">{money(totalCents)}</dd>
              </div>
            </dl>
          </div>

          {quote.payment && (
            <section className="mt-8 border-t pt-6">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                {t.payment}
              </p>
              <Markdown content={quote.payment} className="text-sm" />
            </section>
          )}

          {(quote.notes || quote.terms) && (
            <footer className="mt-8 space-y-4 border-t pt-6 text-sm text-muted-foreground">
              {quote.notes && (
                <div>
                  <p className="font-medium text-foreground">{t.notes}</p>
                  <Markdown content={quote.notes} />
                </div>
              )}
              {quote.terms && (
                <div>
                  <p className="font-medium text-foreground">{t.terms}</p>
                  <Markdown content={quote.terms} />
                </div>
              )}
            </footer>
          )}
        </article>
      </div>
    </div>
  )
}
