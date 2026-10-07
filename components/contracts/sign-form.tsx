'use client'

import {
  type ChangeEvent,
  type FormEvent,
  useState,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import { Lock, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SIGNER_DOCUMENT_TYPES,
  type SignerDocumentType,
} from '@/lib/contracts/document'
import type { SignState } from '@/lib/contracts/sign-action'
import type { SignErrorKey, SignField } from '@/lib/contracts/validation'
import { cn } from '@/lib/utils'

export type SignFormLabels = {
  intro: string
  name: string
  namePlaceholder: string
  document: string
  docTypes: Record<SignerDocumentType, string>
  docNumber: Record<SignerDocumentType, string>
  docPlaceholder: Record<SignerDocumentType, string>
  address: string
  addressPlaceholder: string
  agree: string
  privacy: string
  sign: string
  signing: string
  reload: string
  errors: Record<SignErrorKey | 'changed' | 'not-signable', string>
}

export function SignForm({
  action,
  versionHash,
  labels,
}: {
  action: (formData: FormData) => Promise<SignState>
  versionHash: string
  labels: SignFormLabels
}) {
  const router = useRouter()
  const [state, setState] = useState<SignState>({ status: 'idle' })
  const [isPending, startTransition] = useTransition()
  const [fields, setFields] = useState({ name: '', document: '', address: '' })
  const [docType, setDocType] = useState<SignerDocumentType>('cpf')
  const [agreed, setAgreed] = useState(false)

  const fieldErrors: Partial<Record<SignField, SignErrorKey>> =
    state.status === 'error' ? (state.fieldErrors ?? {}) : {}
  const errorFor = (field: SignField) => {
    const key = fieldErrors[field]
    return key ? labels.errors[key] : null
  }
  const banner =
    state.status === 'error' && state.error !== 'invalid'
      ? labels.errors[state.error]
      : null
  const update =
    (key: keyof typeof fields) => (e: ChangeEvent<HTMLInputElement>) =>
      setFields(f => ({ ...f, [key]: e.target.value }))

  // Controlled fields + onSubmit (not <form action>), so a validation error
  // never clears what the client typed.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const next = await action(formData)
      setState(next)
      if (next.status === 'signed') router.refresh()
    })
  }

  const nameError = errorFor('name')
  const documentError = errorFor('document')
  const addressError = errorFor('address')
  const agreeError = errorFor('agree')

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-muted-foreground">{labels.intro}</p>

      {banner && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{banner}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            {labels.reload}
          </Button>
        </div>
      )}

      <input type="hidden" name="versionHash" value={versionHash} />

      <div className="space-y-1.5">
        <Label htmlFor="signer-name">{labels.name}</Label>
        <Input
          id="signer-name"
          name="name"
          autoComplete="name"
          placeholder={labels.namePlaceholder}
          value={fields.name}
          onChange={update('name')}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? 'signer-name-error' : undefined}
          className="h-11 text-base"
        />
        {nameError && (
          <p id="signer-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-sm font-medium">
            {labels.document}
          </legend>
          <div className="grid grid-cols-3 gap-0.5 rounded-lg bg-muted p-1">
            {SIGNER_DOCUMENT_TYPES.map(type => (
              <label
                key={type}
                className={cn(
                  'flex h-9 cursor-pointer items-center justify-center rounded-md text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  docType === type
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                <input
                  type="radio"
                  name="documentType"
                  value={type}
                  checked={docType === type}
                  onChange={() => setDocType(type)}
                  className="sr-only"
                />
                {labels.docTypes[type]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="signer-document">{labels.docNumber[docType]}</Label>
          <Input
            id="signer-document"
            name="document"
            inputMode={docType === 'cpf' ? 'numeric' : 'text'}
            autoCapitalize="characters"
            placeholder={labels.docPlaceholder[docType]}
            value={fields.document}
            onChange={update('document')}
            aria-invalid={Boolean(documentError)}
            aria-describedby={
              documentError ? 'signer-document-error' : undefined
            }
            className="h-11 font-contract-mono text-base"
          />
          {documentError && (
            <p id="signer-document-error" className="text-sm text-destructive">
              {documentError}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signer-address">{labels.address}</Label>
        <Input
          id="signer-address"
          name="address"
          autoComplete="street-address"
          placeholder={labels.addressPlaceholder}
          value={fields.address}
          onChange={update('address')}
          aria-invalid={Boolean(addressError)}
          aria-describedby={addressError ? 'signer-address-error' : undefined}
          className="h-11 text-base"
        />
        {addressError && (
          <p id="signer-address-error" className="text-sm text-destructive">
            {addressError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="agree"
          className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3.5"
        >
          <input
            id="agree"
            name="agree"
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 size-[18px] shrink-0 accent-slate-900"
          />
          <span className="text-sm leading-relaxed text-slate-700">
            {labels.agree}
          </span>
        </label>
        {agreeError && <p className="text-sm text-destructive">{agreeError}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex flex-1 basis-72 items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          {labels.privacy}
        </p>
        <Button
          type="submit"
          size="lg"
          className="gap-2"
          disabled={!agreed || isPending}
        >
          <PenLine className="size-4" />
          {isPending ? labels.signing : labels.sign}
        </Button>
      </div>
    </form>
  )
}
