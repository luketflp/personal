import { LANGUAGE_LOCALES, formatDate, formatMoney } from '@/lib/format'
import { ISSUER } from '@/lib/quotes/issuer'
import { computeTotals, type TotalsInput } from '@/lib/quotes/totals'
import type { QuoteLanguage } from '@/lib/quotes/validation'

// Starting draft of the clause text; have a lawyer review before real use.

export const CONTRACT_TITLES: Record<QuoteLanguage, string> = {
  pt: 'Contrato de Prestação de Serviços de Desenvolvimento Web',
  en: 'Web Development Services Agreement',
  es: 'Contrato de Prestación de Servicios de Desarrollo Web',
}

export type IssuerLegal = {
  name: string
  document: string
  address: string
  city: string
}

// Legal data stays out of the public repo: set these in the Vercel env.
export function issuerLegal(): IssuerLegal {
  const document = process.env.ISSUER_DOCUMENT?.trim()
  const address = process.env.ISSUER_ADDRESS?.trim()
  const city = process.env.ISSUER_CITY?.trim()
  if (!document || !address || !city) {
    throw new Error('Missing issuer legal data')
  }
  return { name: ISSUER.name, document, address, city }
}

export type ContractTemplateInput = {
  language: QuoteLanguage
  quoteCode: string
  quoteIssueDate: string
  scope: string | null
  items: Array<TotalsInput & { description: string }>
  discountCents: number
  currency: string
  deliveryEstimate: string | null
  payment: string | null
  issuerCity: string
}

type Copy = {
  clause: string
  titles: string[]
  object: (quoteCode: string, date: string) => string
  table: {
    item: string
    qty: string
    amount: string
    discount: string
    total: string
  }
  timelineMissing: string
  price: (total: string) => string
  paymentMissing: string
  obligations: string
  ip: string
  termination: string
  law: (city: string) => string
}

const COPY: Record<QuoteLanguage, Copy> = {
  pt: {
    clause: 'Cláusula',
    titles: [
      'Objeto',
      'Escopo e entregáveis',
      'Prazo',
      'Valor e pagamento',
      'Obrigações das partes',
      'Propriedade intelectual',
      'Rescisão',
      'Assinatura eletrônica e foro',
    ],
    object: (code, date) =>
      `O CONTRATADO prestará ao CONTRATANTE serviços de desenvolvimento web conforme o Orçamento ${code}, de ${date}, nos termos abaixo.`,
    table: {
      item: 'Item',
      qty: 'Qtd.',
      amount: 'Valor',
      discount: 'Desconto',
      total: 'Total',
    },
    timelineMissing: '[Prazo de entrega a definir]',
    price: total => `Valor total de ${total}.`,
    paymentMissing: '[Condições de pagamento a definir]',
    obligations:
      'O CONTRATADO executará os serviços com zelo técnico e manterá o CONTRATANTE informado do andamento. O CONTRATANTE fornecerá os materiais necessários (textos, imagens, acessos) e retornará as revisões em até 3 dias úteis.',
    ip: 'Após a quitação integral, os direitos patrimoniais sobre o trabalho entregue passam ao CONTRATANTE. O CONTRATADO poderá exibir o trabalho em seu portfólio.',
    termination:
      'Qualquer parte pode rescindir este contrato mediante aviso prévio de 7 dias. Valores referentes a etapas já concluídas não são reembolsáveis.',
    law: city =>
      `As partes reconhecem a validade da assinatura eletrônica deste instrumento, nos termos do art. 10, § 2º, da MP 2.200-2/2001. Este contrato é regido pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de ${city} para dirimir quaisquer controvérsias.`,
  },
  en: {
    clause: 'Clause',
    titles: [
      'Purpose',
      'Scope and deliverables',
      'Timeline',
      'Price and payment',
      'Obligations of the parties',
      'Intellectual property',
      'Termination',
      'Electronic signature and jurisdiction',
    ],
    object: (code, date) =>
      `The CONTRACTOR will provide the CLIENT with web development services as set out in Quote ${code}, dated ${date}, under the terms below.`,
    table: {
      item: 'Item',
      qty: 'Qty.',
      amount: 'Amount',
      discount: 'Discount',
      total: 'Total',
    },
    timelineMissing: '[Delivery timeline to be defined]',
    price: total => `Total price of ${total}.`,
    paymentMissing: '[Payment terms to be defined]',
    obligations:
      'The CONTRACTOR will perform the services with technical diligence and keep the CLIENT informed of progress. The CLIENT will provide the required materials (copy, images, access credentials) and return feedback within 3 business days.',
    ip: 'Upon full payment, the economic rights to the delivered work transfer to the CLIENT. The CONTRACTOR may display the work in their portfolio.',
    termination:
      "Either party may terminate this agreement with 7 days' prior notice. Amounts for stages already completed are non-refundable.",
    law: city =>
      `The parties acknowledge the validity of the electronic signature of this agreement under article 10, paragraph 2, of Brazilian Provisional Measure 2,200-2/2001. This agreement is governed by the laws of the Federative Republic of Brazil, and the courts of ${city}, Brazil, are elected to settle any disputes.`,
  },
  es: {
    clause: 'Cláusula',
    titles: [
      'Objeto',
      'Alcance y entregables',
      'Plazo',
      'Precio y pago',
      'Obligaciones de las partes',
      'Propiedad intelectual',
      'Rescisión',
      'Firma electrónica y jurisdicción',
    ],
    object: (code, date) =>
      `El CONTRATADO prestará al CONTRATANTE servicios de desarrollo web según el Presupuesto ${code}, del ${date}, en los términos siguientes.`,
    table: {
      item: 'Ítem',
      qty: 'Cant.',
      amount: 'Valor',
      discount: 'Descuento',
      total: 'Total',
    },
    timelineMissing: '[Plazo de entrega por definir]',
    price: total => `Precio total de ${total}.`,
    paymentMissing: '[Condiciones de pago por definir]',
    obligations:
      'El CONTRATADO ejecutará los servicios con diligencia técnica y mantendrá al CONTRATANTE informado del avance. El CONTRATANTE proporcionará los materiales necesarios (textos, imágenes, accesos) y enviará sus revisiones en un plazo de 3 días hábiles.',
    ip: 'Tras el pago total, los derechos patrimoniales sobre el trabajo entregado pasan al CONTRATANTE. El CONTRATADO podrá mostrar el trabajo en su portafolio.',
    termination:
      'Cualquiera de las partes puede rescindir este contrato con un aviso previo de 7 días. Los montos de etapas ya concluidas no son reembolsables.',
    law: city =>
      `Las partes reconocen la validez de la firma electrónica de este instrumento, conforme al art. 10, § 2º, de la Medida Provisoria brasileña 2.200-2/2001. Este contrato se rige por las leyes de la República Federativa de Brasil, y se elige el foro de ${city}, Brasil, para resolver cualquier controversia.`,
  },
}

// Keeps a value inside one markdown table cell.
function cell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')
}

export function renderContractBody(input: ContractTemplateInput) {
  const c = COPY[input.language]
  const locale = LANGUAGE_LOCALES[input.language]
  const money = (cents: number) => formatMoney(cents, input.currency, locale)
  const { totalCents } = computeTotals(input.items, input.discountCents)

  const rows = input.items.map(
    item =>
      `| ${cell(item.description)} | ${Number(item.quantity)} | ${money(
        Math.round(Number(item.quantity) * item.unitPriceCents),
      )} |`,
  )
  if (input.discountCents > 0) {
    rows.push(`| ${c.table.discount} | | −${money(input.discountCents)} |`)
  }
  rows.push(`| **${c.table.total}** | | **${money(totalCents)}** |`)
  const table = [
    `| ${c.table.item} | ${c.table.qty} | ${c.table.amount} |`,
    '|---|---:|---:|',
    ...rows,
  ].join('\n')

  const clauses = [
    c.object(input.quoteCode, formatDate(input.quoteIssueDate, locale)),
    [input.scope?.trim(), table].filter(Boolean).join('\n\n'),
    input.deliveryEstimate?.trim() || c.timelineMissing,
    `${c.price(money(totalCents))}\n\n${input.payment?.trim() || c.paymentMissing}`,
    c.obligations,
    c.ip,
    c.termination,
    c.law(input.issuerCity),
  ]

  return clauses
    .map((text, i) => `## ${c.clause} ${i + 1} — ${c.titles[i]}\n\n${text}`)
    .join('\n\n')
}
