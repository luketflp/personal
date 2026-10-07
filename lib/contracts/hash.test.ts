import { describe, expect, it } from 'vitest'
import { signedHash, versionHash } from '@/lib/contracts/hash'

const base = {
  code: 'CT-2026-001',
  language: 'pt',
  body: '## Cláusula 1 — Objeto',
  totalCents: 300_000,
  currency: 'BRL',
  issuerName: 'Lucas Alexander',
  issuerDocument: '11.222.333/0001-81',
  issuerAddress: 'Rua A, 1',
  sentAt: new Date('2026-10-05T13:12:00Z'),
  signerName: 'Helena Costa Ribeiro',
  signerDocumentType: 'cpf',
  signerDocument: '52998224725',
  signerAddress: 'Rua B, 2',
  signedAt: new Date('2026-10-07T18:42:00Z'),
}

describe('versionHash', () => {
  it('is a stable 64-character hex digest', () => {
    expect(versionHash(base)).toMatch(/^[0-9a-f]{64}$/)
    expect(versionHash({ ...base })).toBe(versionHash(base))
  })

  const patches: Record<string, Partial<typeof base>> = {
    body: { body: '## Cláusula 1 — Objeto.' },
    totalCents: { totalCents: 300_001 },
    currency: { currency: 'USD' },
    language: { language: 'en' },
    issuerDocument: { issuerDocument: '11.222.333/0001-82' },
    issuerAddress: { issuerAddress: 'Rua A, 2' },
  }
  it.each(Object.entries(patches))('changes when %s changes', (_, patch) => {
    expect(versionHash({ ...base, ...patch })).not.toBe(versionHash(base))
  })
})

describe('signedHash', () => {
  const patches: Record<string, Partial<typeof base>> = {
    code: { code: 'CT-2026-002' },
    body: { body: 'x' },
    sentAt: { sentAt: new Date('2026-10-05T13:12:00.001Z') },
    signerName: { signerName: 'Helena C. Ribeiro' },
    signerDocumentType: { signerDocumentType: 'other' },
    signerDocument: { signerDocument: '12345678909' },
    signerAddress: { signerAddress: 'Rua B, 3' },
    signedAt: { signedAt: new Date('2026-10-07T18:42:00.001Z') },
  }
  it.each(Object.entries(patches))('changes when %s changes', (_, patch) => {
    expect(signedHash({ ...base, ...patch })).not.toBe(signedHash(base))
  })

  it('does not collide when text moves between adjacent fields', () => {
    expect(
      signedHash({ ...base, issuerName: 'Lucas A', issuerDocument: 'X' }),
    ).not.toBe(
      signedHash({ ...base, issuerName: 'Lucas', issuerDocument: ' AX' }),
    )
  })
})
