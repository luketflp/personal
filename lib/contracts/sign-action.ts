'use server'

// Only public action for contracts. Kept apart from the dashboard actions so
// the public page never bundles them.

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { eq } from 'drizzle-orm'
import { signedHash, versionHash } from '@/lib/contracts/hash'
import {
  firstErrors,
  signPayloadSchema,
  type SignErrorKey,
  type SignField,
} from '@/lib/contracts/validation'
import { db } from '@/lib/db'
import { contracts } from '@/lib/db/schema'
import { clientIp } from '@/lib/quotes/visitor-context'
import { notifyTelegram } from '@/lib/telegram'

export type SignState =
  | { status: 'idle' }
  | { status: 'signed' }
  | {
      status: 'error'
      error: 'invalid' | 'changed' | 'not-signable'
      fieldErrors?: Partial<Record<SignField, SignErrorKey>>
    }

export async function signContract(
  slug: string,
  formData: FormData,
): Promise<SignState> {
  const parsed = signPayloadSchema.safeParse({
    name: formData.get('name'),
    documentType: formData.get('documentType'),
    document: formData.get('document'),
    address: formData.get('address'),
    agree: formData.get('agree') === 'on',
    versionHash: formData.get('versionHash'),
  })
  if (!parsed.success) {
    return {
      status: 'error',
      error: 'invalid',
      fieldErrors: firstErrors(parsed.error),
    }
  }
  const input = parsed.data
  const requestHeaders = await headers()
  const signedAt = new Date()

  // Row lock: two tabs submitting at once can't both sign, and an owner edit
  // waits for the signature (then finds the contract no longer editable).
  const result = await db.transaction(async tx => {
    const [contract] = await tx
      .select()
      .from(contracts)
      .where(eq(contracts.slug, slug))
      .for('update')
    if (!contract || contract.status !== 'sent' || !contract.sentAt) {
      return 'not-signable' as const
    }
    if (versionHash(contract) !== input.versionHash) return 'changed' as const

    const signer = {
      signerName: input.name,
      signerDocumentType: input.documentType,
      signerDocument: input.document,
      signerAddress: input.address,
      signedAt,
    }
    await tx
      .update(contracts)
      .set({
        ...signer,
        signerIp: clientIp(requestHeaders),
        signerUserAgent:
          requestHeaders.get('user-agent')?.slice(0, 500) ?? null,
        signedHash: signedHash({
          ...contract,
          sentAt: contract.sentAt,
          ...signer,
        }),
        status: 'signed',
        updatedAt: signedAt,
      })
      .where(eq(contracts.id, contract.id))
    return contract
  })

  if (result === 'not-signable' || result === 'changed') {
    return { status: 'error', error: result }
  }

  revalidatePath(`/c/${slug}`)
  revalidatePath('/dashboard/contracts')
  revalidatePath(`/dashboard/contracts/${result.id}`)
  after(() =>
    notifyTelegram(
      [
        `Contrato assinado: ${result.code}`,
        `Assinado por: ${input.name}`,
        `Cliente: ${result.customerName}`,
        '',
        `https://www.lucasalexander.com.br/dashboard/contracts/${result.id}`,
      ].join('\n'),
    ),
  )
  return { status: 'signed' }
}
