'use client'

import 'react-phone-number-input/style.css'
import {
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import PhoneInput, {
  isValidPhoneNumber,
  type Country,
} from 'react-phone-number-input'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createQuoteRequest } from '@/lib/quotes/request-actions'
import type { Dictionary, Language } from '@/lib/i18n/dictionaries'

const EMPTY = { name: '', email: '', phone: '', message: '' }

const DEFAULT_COUNTRY: Record<Language, Country> = {
  pt: 'BR',
  en: 'US',
  es: 'ES',
}

export function ContactForm({
  copy,
  language,
}: {
  copy: Dictionary['quoteRequest']
  language: Language
}) {
  const [values, setValues] = useState(EMPTY)
  const [isPending, startTransition] = useTransition()

  const set =
    (key: keyof typeof EMPTY) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues(v => ({ ...v, [key]: event.target.value }))

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (values.phone && !isValidPhoneNumber(values.phone)) {
      toast.error(copy.phoneInvalid)
      return
    }
    startTransition(async () => {
      const res = await createQuoteRequest(values)
      if (!res.ok) {
        toast.error(copy.error)
        return
      }
      toast.success(copy.success)
      setValues(EMPTY)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-name">{copy.name}</Label>
          <Input
            id="c-name"
            required
            value={values.name}
            onChange={set('name')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">{copy.email}</Label>
          <Input
            id="c-email"
            type="email"
            required
            value={values.email}
            onChange={set('email')}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-phone">{copy.phone}</Label>
        <PhoneInput
          id="c-phone"
          international
          defaultCountry={DEFAULT_COUNTRY[language]}
          autoComplete="tel"
          inputComponent={Input}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 [&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountryIcon]:overflow-hidden [&_.PhoneInputCountryIcon]:rounded-sm [&_.PhoneInputCountryIcon]:shadow-none"
          numberInputProps={{
            className:
              'h-full border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0',
          }}
          value={values.phone}
          onChange={phone => setValues(v => ({ ...v, phone: phone ?? '' }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-message">{copy.message}</Label>
        <Textarea
          id="c-message"
          required
          rows={5}
          value={values.message}
          onChange={set('message')}
        />
      </div>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? copy.sending : copy.submit}
      </Button>
    </form>
  )
}
