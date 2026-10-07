import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Ban, Fingerprint, ShieldCheck } from 'lucide-react'
import { ContractBody } from '@/components/contracts/contract-body'
import { SignForm, type SignFormLabels } from '@/components/contracts/sign-form'
import { PrintButton } from '@/components/quotes/print-button'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'
import { documentLine } from '@/lib/contracts/document'
import { contractFonts } from '@/lib/contracts/fonts'
import { versionHash } from '@/lib/contracts/hash'
import { getContractBySlug } from '@/lib/contracts/queries'
import { signContract } from '@/lib/contracts/sign-action'
import { CONTRACT_TITLES } from '@/lib/contracts/template'
import { LANGUAGE_LOCALES, formatMoney, formatTimestamp } from '@/lib/format'
import { ISSUER } from '@/lib/quotes/issuer'
import { quoteLanguage } from '@/lib/quotes/language'
import type { QuoteLanguage } from '@/lib/quotes/validation'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Owner-only notes; the owner reads Portuguese.
const OWNER_DRAFT = 'Rascunho: não visível ao cliente até ser enviado.'
const OWNER_FORM =
  'Você está logado como emissor. O cliente verá aqui o formulário de assinatura.'

type Labels = {
  document: string
  notFound: string
  voided: string
  issued: string
  quoteRef: string
  total: string
  parties: string
  contractor: string
  client: string
  clientPending: string
  signatures: string
  signedTitle: string
  signedText: (name: string, when: string) => string
  signedBoth: string
  issuedAt: (when: string) => string
  signedAt: (when: string, ip: string | null) => string
  fingerprint: string
  about: string
  print: string
  form: SignFormLabels
}

const LABELS: Record<QuoteLanguage, Labels> = {
  pt: {
    document: 'Contrato',
    notFound: 'Contrato não encontrado',
    voided: 'Este contrato foi cancelado e não pode mais ser assinado.',
    issued: 'Emitido em',
    quoteRef: 'Referente ao Orçamento',
    total: 'Valor total',
    parties: 'Partes',
    contractor: 'Contratado',
    client: 'Contratante',
    clientPending:
      'A qualificação completa é preenchida por você no momento da assinatura, ao final deste documento.',
    signatures: 'Assinaturas',
    signedTitle: 'Contrato assinado',
    signedText: (name, when) =>
      `Assinado eletronicamente por ${name} em ${when}. Guarde uma cópia em PDF.`,
    signedBoth: 'Assinado eletronicamente pelas duas partes.',
    issuedAt: when => `Emitido em ${when}`,
    signedAt: (when, ip) => `Assinado em ${when}${ip ? ` · IP ${ip}` : ''}`,
    fingerprint: 'Impressão digital SHA-256',
    about: 'Conheça mais sobre meu trabalho',
    print: 'Imprimir / Salvar PDF',
    form: {
      intro: 'Preencha seus dados como devem constar no contrato.',
      name: 'Nome completo ou razão social',
      namePlaceholder: 'Como no documento',
      document: 'Documento',
      docTypes: { cpf: 'CPF', cnpj: 'CNPJ', other: 'Outro' },
      docNumber: {
        cpf: 'Número do CPF',
        cnpj: 'Número do CNPJ',
        other: 'Passaporte ou ID fiscal',
      },
      docPlaceholder: {
        cpf: '000.000.000-00',
        cnpj: '00.000.000/0000-00',
        other: 'X1234567',
      },
      address: 'Endereço completo',
      addressPlaceholder: 'Rua, número, bairro, cidade/UF',
      agree:
        'Li e concordo com todos os termos deste contrato e reconheço esta assinatura eletrônica como válida.',
      privacy:
        'Ao assinar, registramos data, hora, IP e uma impressão digital SHA-256 do documento.',
      sign: 'Assinar contrato',
      signing: 'Assinando…',
      reload: 'Recarregar',
      errors: {
        required: 'Campo obrigatório.',
        tooLong: 'Texto longo demais.',
        invalidDocument: 'Número de documento inválido.',
        mustAgree: 'Marque a caixa para concordar com os termos.',
        invalid: 'Verifique os campos destacados.',
        failed:
          'Não foi possível assinar agora. Verifique sua conexão e tente novamente.',
        changed:
          'Este contrato foi atualizado. Recarregue a página para ler a versão mais recente.',
        'not-signable':
          'Este contrato não pode mais ser assinado. Recarregue a página.',
      },
    },
  },
  en: {
    document: 'Contract',
    notFound: 'Contract not found',
    voided: 'This contract was cancelled and can no longer be signed.',
    issued: 'Issued',
    quoteRef: 'Related to Quote',
    total: 'Total',
    parties: 'Parties',
    contractor: 'Contractor',
    client: 'Client',
    clientPending:
      'Your full legal details are filled in when you sign, at the end of this document.',
    signatures: 'Signatures',
    signedTitle: 'Contract signed',
    signedText: (name, when) =>
      `Signed electronically by ${name} on ${when}. Keep a PDF copy.`,
    signedBoth: 'Signed electronically by both parties.',
    issuedAt: when => `Issued ${when}`,
    signedAt: (when, ip) => `Signed ${when}${ip ? ` · IP ${ip}` : ''}`,
    fingerprint: 'SHA-256 fingerprint',
    about: 'Learn more about my work',
    print: 'Print / Save PDF',
    form: {
      intro: 'Enter your details as they should appear in the contract.',
      name: 'Full name or company legal name',
      namePlaceholder: 'As on your ID',
      document: 'Document',
      docTypes: { cpf: 'CPF', cnpj: 'CNPJ', other: 'Other' },
      docNumber: {
        cpf: 'CPF number',
        cnpj: 'CNPJ number',
        other: 'Passport or tax ID',
      },
      docPlaceholder: {
        cpf: '000.000.000-00',
        cnpj: '00.000.000/0000-00',
        other: 'X1234567',
      },
      address: 'Full address',
      addressPlaceholder: 'Street, number, city, country',
      agree:
        'I have read and agree to all terms of this agreement and accept this electronic signature as valid.',
      privacy:
        'When you sign, we record the date, time, IP address and a SHA-256 fingerprint of the document.',
      sign: 'Sign agreement',
      signing: 'Signing…',
      reload: 'Reload',
      errors: {
        required: 'This field is required.',
        tooLong: 'This text is too long.',
        invalidDocument: 'Invalid document number.',
        mustAgree: 'Tick the box to agree to the terms.',
        invalid: 'Check the highlighted fields.',
        failed:
          "We couldn't sign right now. Check your connection and try again.",
        changed:
          'This contract was updated. Reload the page to read the latest version.',
        'not-signable':
          'This contract can no longer be signed. Reload the page.',
      },
    },
  },
  es: {
    document: 'Contrato',
    notFound: 'Contrato no encontrado',
    voided: 'Este contrato fue cancelado y ya no puede firmarse.',
    issued: 'Emitido el',
    quoteRef: 'Referente al Presupuesto',
    total: 'Valor total',
    parties: 'Partes',
    contractor: 'Contratado',
    client: 'Contratante',
    clientPending:
      'Tus datos completos se completan al firmar, al final de este documento.',
    signatures: 'Firmas',
    signedTitle: 'Contrato firmado',
    signedText: (name, when) =>
      `Firmado electrónicamente por ${name} el ${when}. Guarda una copia en PDF.`,
    signedBoth: 'Firmado electrónicamente por ambas partes.',
    issuedAt: when => `Emitido el ${when}`,
    signedAt: (when, ip) => `Firmado el ${when}${ip ? ` · IP ${ip}` : ''}`,
    fingerprint: 'Huella digital SHA-256',
    about: 'Conoce más sobre mi trabajo',
    print: 'Imprimir / Guardar PDF',
    form: {
      intro: 'Completa tus datos tal como deben figurar en el contrato.',
      name: 'Nombre completo o razón social',
      namePlaceholder: 'Como en el documento',
      document: 'Documento',
      docTypes: { cpf: 'CPF', cnpj: 'CNPJ', other: 'Otro' },
      docNumber: {
        cpf: 'Número de CPF',
        cnpj: 'Número de CNPJ',
        other: 'Pasaporte o ID fiscal',
      },
      docPlaceholder: {
        cpf: '000.000.000-00',
        cnpj: '00.000.000/0000-00',
        other: 'X1234567',
      },
      address: 'Dirección completa',
      addressPlaceholder: 'Calle, número, ciudad, país',
      agree:
        'He leído y acepto todos los términos de este contrato y reconozco esta firma electrónica como válida.',
      privacy:
        'Al firmar, registramos la fecha, hora, IP y una huella digital SHA-256 del documento.',
      sign: 'Firmar contrato',
      signing: 'Firmando…',
      reload: 'Recargar',
      errors: {
        required: 'Campo obligatorio.',
        tooLong: 'Texto demasiado largo.',
        invalidDocument: 'Número de documento inválido.',
        mustAgree: 'Marca la casilla para aceptar los términos.',
        invalid: 'Revisa los campos marcados.',
        failed:
          'No pudimos firmar en este momento. Revisa tu conexión e inténtalo de nuevo.',
        changed:
          'Este contrato fue actualizado. Recarga la página para leer la versión más reciente.',
        'not-signable':
          'Este contrato ya no puede firmarse. Recarga la página.',
      },
    },
  },
}

const neverSent = (c: { status: string; sentAt: Date | null }) =>
  c.status === 'draft' || (c.status === 'void' && !c.sentAt)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const contract = await getContractBySlug(slug)
  const robots = { index: false, follow: false }
  if (!contract || neverSent(contract)) {
    return { title: LABELS.pt.notFound, robots }
  }
  const t = LABELS[quoteLanguage(contract.language)]
  return {
    title: `${t.document} ${contract.code} — ${contract.customerName}`,
    robots,
  }
}

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const contract = await getContractBySlug(slug)
  if (!contract) notFound()

  const isOwner = await verifySessionToken(
    (await cookies()).get(SESSION_COOKIE)?.value,
  )
  if (neverSent(contract) && !isOwner) notFound()

  const lang = quoteLanguage(contract.language)
  const t = LABELS[lang]
  const locale = LANGUAGE_LOCALES[lang]
  const signed = contract.status === 'signed'
  const signedWhen = formatTimestamp(contract.signedAt, locale)

  return (
    <div
      className={cn(
        contractFonts,
        'min-h-screen bg-muted/40 px-4 py-10 print:bg-white print:p-0',
      )}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/?lang=${lang}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t.about}
          </Link>
          <PrintButton label={t.print} />
        </div>

        <article className="rounded-xl border bg-white px-5 pb-12 pt-10 shadow-sm sm:px-12 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {contract.status === 'draft' && (
            <div className="no-print mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800">
              {OWNER_DRAFT}
            </div>
          )}
          {contract.status === 'void' && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              <Ban className="size-4 shrink-0" /> {t.voided}
            </div>
          )}
          {signed && (
            <div
              role="status"
              className="mb-7 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-emerald-800"
            >
              <ShieldCheck className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t.signedTitle}</p>
                <p className="mt-0.5 text-[13px]">
                  {t.signedText(contract.signerName ?? '', signedWhen)}
                </p>
              </div>
            </div>
          )}

          <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
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
                <p className="text-[22px] font-bold leading-tight tracking-tight text-slate-900">
                  {ISSUER.name}
                </p>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {ISSUER.title[lang]}
                </p>
                <p className="mt-1.5 break-all text-[13px] text-muted-foreground">
                  {ISSUER.email}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t.document}
              </p>
              <p className="mt-1 font-contract-mono text-[15px] font-medium text-slate-900">
                {contract.code}
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {t.issued}{' '}
                {formatTimestamp(contract.sentAt ?? new Date(), locale, false)}
              </p>
            </div>
          </header>

          <h1 className="mt-8 font-contract-serif text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {CONTRACT_TITLES[lang]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {contract.quoteCode && (
              <>
                {t.quoteRef}{' '}
                <span className="font-contract-mono text-[13px]">
                  {contract.quoteCode}
                </span>{' '}
                ·{' '}
              </>
            )}
            {t.total}{' '}
            <strong className="tabular-nums text-slate-900">
              {formatMoney(contract.totalCents, contract.currency, locale)}
            </strong>
          </p>

          <section aria-labelledby="parties-title" className="mt-7">
            <h2
              id="parties-title"
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              {t.parties}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.contractor}
                </p>
                <p className="mt-2 font-semibold">{contract.issuerName}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                  {contract.issuerDocument}
                  <br />
                  {contract.issuerAddress}
                  <br />
                  {ISSUER.email}
                </p>
              </div>
              {signed ? (
                <div className="rounded-lg border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.client}
                  </p>
                  <p className="mt-2 font-semibold">{contract.signerName}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                    {documentLine(
                      contract.signerDocumentType,
                      contract.signerDocument,
                    )}
                    <br />
                    {contract.signerAddress}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.client}
                  </p>
                  <p className="mt-2 font-semibold">
                    {contract.customerCompany ?? contract.customerName}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {t.clientPending}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="mt-8">
            <ContractBody body={contract.body} />
          </div>

          <section
            aria-labelledby="signatures-title"
            className="mt-10 border-t pt-8"
          >
            <h2
              id="signatures-title"
              className="mb-1 text-lg font-bold tracking-tight text-slate-900"
            >
              {t.signatures}
            </h2>

            {contract.status === 'sent' && !isOwner && (
              <div className="no-print">
                <SignForm
                  action={signContract.bind(null, contract.slug)}
                  versionHash={versionHash(contract)}
                  labels={t.form}
                />
              </div>
            )}
            {contract.status === 'sent' && isOwner && (
              <p className="text-sm text-muted-foreground">{OWNER_FORM}</p>
            )}

            {signed && (
              <>
                <p className="mb-5 text-sm text-muted-foreground">
                  {t.signedBoth}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.contractor}
                    </p>
                    <p className="mt-2.5 font-contract-serif text-xl italic text-slate-900">
                      {contract.issuerName}
                    </p>
                    <p className="mt-2 text-[13px] text-slate-600">
                      {t.issuedAt(formatTimestamp(contract.sentAt, locale))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                      {t.client}
                    </p>
                    <p className="mt-2.5 font-contract-serif text-xl italic text-slate-900">
                      {contract.signerName}
                    </p>
                    <p className="mt-2 text-[13px] text-slate-600">
                      {t.signedAt(signedWhen, contract.signerIp)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-slate-100 print:border print:bg-white print:text-slate-900">
                  <Fingerprint className="size-4 shrink-0 text-slate-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {t.fingerprint}
                  </span>
                  <code className="break-all font-contract-mono text-xs">
                    {contract.signedHash}
                  </code>
                </div>
              </>
            )}
          </section>
        </article>

        <p className="no-print text-center text-xs text-muted-foreground">
          lucasalexander.com.br
        </p>
      </div>
    </div>
  )
}
