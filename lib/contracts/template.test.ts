import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type ContractTemplateInput,
  issuerLegal,
  renderContractBody,
} from '@/lib/contracts/template'
import { formatMoney } from '@/lib/format'

const input: ContractTemplateInput = {
  language: 'pt',
  quoteCode: 'LA-2026-014',
  quoteIssueDate: '2026-10-02',
  scope: 'Site institucional de página única.',
  items: [
    { description: 'Site one-page', quantity: '1', unitPriceCents: 240_000 },
    {
      description: 'Links e páginas extras',
      quantity: '2',
      unitPriceCents: 20_000,
    },
  ],
  discountCents: 0,
  currency: 'BRL',
  deliveryEstimate: '15 dias úteis após o pagamento da primeira parcela.',
  payment: '50% na assinatura e 50% na entrega, via Pix.',
  issuerCity: 'Curitiba/PR',
}

describe('renderContractBody', () => {
  it('renders eight numbered clauses in Portuguese', () => {
    const body = renderContractBody(input)
    expect(body.match(/^## Cláusula \d+ — /gm)).toHaveLength(8)
    expect(body).toContain('## Cláusula 1 — Objeto')
    expect(body).toContain('Orçamento LA-2026-014, de 2 de outubro de 2026')
    expect(body).toContain('Site institucional de página única.')
    expect(body).toContain('50% na assinatura e 50% na entrega, via Pix.')
  })

  it('lists every item with its line total and the quote total', () => {
    const body = renderContractBody(input)
    expect(body).toContain(
      `| Site one-page | 1 | ${formatMoney(240_000, 'BRL', 'pt-BR')} |`,
    )
    expect(body).toContain(
      `| Links e páginas extras | 2 | ${formatMoney(40_000, 'BRL', 'pt-BR')} |`,
    )
    expect(body).toContain(
      `| **Total** | | **${formatMoney(280_000, 'BRL', 'pt-BR')}** |`,
    )
  })

  it('subtracts the discount in other currencies and languages', () => {
    const body = renderContractBody({
      ...input,
      language: 'en',
      currency: 'USD',
      discountCents: 30_000,
    })
    expect(body).toContain('## Clause 1 — Purpose')
    expect(body).toContain(
      `| Discount | | −${formatMoney(30_000, 'USD', 'en-US')} |`,
    )
    expect(body).toContain(
      `| **Total** | | **${formatMoney(250_000, 'USD', 'en-US')}** |`,
    )
  })

  it('renders Spanish', () => {
    const body = renderContractBody({ ...input, language: 'es' })
    expect(body).toContain('Presupuesto LA-2026-014')
    expect(body).toContain('## Cláusula 8 — Firma electrónica y jurisdicción')
  })

  it('uses placeholders when delivery and payment are empty', () => {
    const body = renderContractBody({
      ...input,
      deliveryEstimate: null,
      payment: '   ',
    })
    expect(body).toContain('[Prazo de entrega a definir]')
    expect(body).toContain('[Condições de pagamento a definir]')
  })

  it('keeps pipes and line breaks in item descriptions inside one cell', () => {
    const body = renderContractBody({
      ...input,
      items: [
        {
          description: 'Logo | ícone\nfavicon',
          quantity: '1',
          unitPriceCents: 10_000,
        },
      ],
    })
    expect(body).toContain('| Logo \\| ícone favicon | 1 |')
  })

  it('names the forum city in the last clause', () => {
    expect(renderContractBody(input)).toMatch(
      /## Cláusula 8 — [^\n]+\n\n[^\n]*Curitiba\/PR/,
    )
  })
})

describe('issuerLegal', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads the three env vars', () => {
    vi.stubEnv('ISSUER_DOCUMENT', '11.222.333/0001-81')
    vi.stubEnv('ISSUER_ADDRESS', 'Rua A, 1 — Curitiba/PR')
    vi.stubEnv('ISSUER_CITY', 'Curitiba/PR')
    expect(issuerLegal()).toEqual({
      name: 'Lucas Alexander',
      document: '11.222.333/0001-81',
      address: 'Rua A, 1 — Curitiba/PR',
      city: 'Curitiba/PR',
    })
  })

  it('throws when any of them is missing or blank', () => {
    vi.stubEnv('ISSUER_DOCUMENT', '11.222.333/0001-81')
    vi.stubEnv('ISSUER_ADDRESS', '   ')
    vi.stubEnv('ISSUER_CITY', 'Curitiba/PR')
    expect(() => issuerLegal()).toThrow('Missing issuer legal data')
  })
})
