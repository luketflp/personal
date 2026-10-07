import { createHash } from 'node:crypto'
import type { Contract } from '@/lib/db/schema'

// Arrays, not objects: positions are fixed, so key order can never drift and
// text can't slide between neighbouring fields.
function sha256(values: unknown[]) {
  return createHash('sha256').update(JSON.stringify(values)).digest('hex')
}

export type VersionFields = Pick<
  Contract,
  | 'body'
  | 'totalCents'
  | 'currency'
  | 'language'
  | 'issuerDocument'
  | 'issuerAddress'
>

// What the client is looking at; embedded in the sign form and rechecked on
// submit so nobody signs a text that changed underneath them.
export function versionHash(c: VersionFields) {
  return sha256([
    c.body,
    c.totalCents,
    c.currency,
    c.language,
    c.issuerDocument,
    c.issuerAddress,
  ])
}

export type SignedFields = Pick<
  Contract,
  | 'code'
  | 'language'
  | 'body'
  | 'totalCents'
  | 'currency'
  | 'issuerName'
  | 'issuerDocument'
  | 'issuerAddress'
> & {
  sentAt: Date
  signerName: string
  signerDocumentType: string
  signerDocument: string
  signerAddress: string
  signedAt: Date
}

// Fingerprint of the signed contract, stored and shown on the document.
export function signedHash(c: SignedFields) {
  return sha256([
    c.code,
    c.language,
    c.body,
    c.totalCents,
    c.currency,
    c.issuerName,
    c.issuerDocument,
    c.issuerAddress,
    c.sentAt.toISOString(),
    c.signerName,
    c.signerDocumentType,
    c.signerDocument,
    c.signerAddress,
    c.signedAt.toISOString(),
  ])
}
