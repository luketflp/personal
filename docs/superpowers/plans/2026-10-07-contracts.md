# Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a service contract from an accepted quote, edit it in the dashboard, and let the client sign it online at `/c/[slug]` with an audit trail and SHA-256 fingerprint.

**Architecture:** One new `contracts` table holds a full snapshot (markdown body, totals, issuer legal data, signer data). Pure modules under `lib/contracts/` (document validation, status rules, hashing, template, stats) carry all the logic and are unit-tested; server actions and pages are thin layers over them. Dashboard actions check the session themselves; the public sign action lives in its own file and locks the row with `SELECT … FOR UPDATE`.

**Tech Stack:** Next.js 15 (App Router, server actions), React 19, Drizzle ORM + Postgres, zod 3, Tailwind 3.4 + shadcn/ui, Vitest, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-10-07-contracts-design.md`. UI reference: Claude Design canvas https://claude.ai/artifact/Xg7gBSB7WRuuhBLLJDRacD (artboards 01 list, 02 editor, 03 public page + signing, 04 signed on mobile).

## Global Constraints

- Branch: `feat/contracts` (already created; the spec is committed there).
- Commit messages: Conventional Commits (`feat(contracts): …`, `refactor(quotes): …`). **Never** add `Co-Authored-By`, session links, "Generated with" footers or any tool/model name to commits, PRs, code or comments.
- No new npm dependencies. Fonts come from `next/font/google` (already part of Next).
- Languages: `pt`, `en`, `es` (`LANGUAGES` / `QuoteLanguage` from `lib/quotes/validation.ts`). Governing law is Brazilian in all three.
- Dashboard UI copy is Portuguese. Public page copy is per contract language.
- Issuer legal data only from env: `ISSUER_DOCUMENT`, `ISSUER_ADDRESS`, `ISSUER_CITY`. Never hardcode them (the repo is public).
- Money is integer cents everywhere; display with `formatMoney`.
- Timestamps (`timestamptz`) are displayed with `formatTimestamp` (Brazil time, Task 5), never `formatDate` (which is for `date` columns).
- Pure modules (`document`, `validation`, `status`, `hash`, `stats`, `template`) must not import `@/lib/db` (it throws without `DATABASE_URL`); type-only imports from `@/lib/db/schema` are fine.
- Match the surrounding code: 2-space indent, single quotes, no semicolons, trailing commas (Prettier config in repo).
- Verification commands: `pnpm test` (Vitest), `pnpm exec tsc --noEmit -p .` (typecheck). Baseline before this plan: 91 tests passing, typecheck clean.
- No local database is configured (`DATABASE_URL` unset). Anything needing a DB is verified in Task 11's manual checklist.

## Review Focus

1. Timestamps rendered on Vercel (server in UTC) must show Brazil time: a signature at 18:42 UTC shows 15:42, and 01:30 UTC on Oct 8 shows Oct 7. Test lives in Task 5.
2. Clients type documents with dots, dashes, slashes, spaces or lowercase letters (alphanumeric CNPJ, issued since July 2026): these must validate and be stored normalized (`52998224725`, `12ABC34501DE35`). Test lives in Task 2.
3. Whitespace-only, missing (`null` from `FormData`) or overlong signer fields must come back as field errors (`required` / `tooLong`), never as a crash or a stored blank. Test lives in Task 2.
4. `x-forwarded-for` with several hops and spaces (`" 189.6.24.117 , 10.0.0.1"`) records the first IP; no headers records `null`. Test lives in Task 5.
5. A contract signed on Dec 31 at 22:00 in São Paulo (Jan 1 01:00 UTC) counts toward the Brazilian year in "Valor assinado no ano". Test lives in Task 3.

---

## File map

| File | Responsibility |
|---|---|
| `lib/db/schema.ts` (modify) | `contract_status` enum, `contracts` table, relations, types |
| `drizzle/0011_*.sql` (generated) | Migration |
| `lib/contracts/document.ts` | CPF/CNPJ check digits, normalization, display |
| `lib/contracts/validation.ts` | zod schemas for signing and body; error keys |
| `lib/contracts/status.ts` | Lifecycle transitions, badge styles |
| `lib/contracts/hash.ts` | `versionHash`, `signedHash` |
| `lib/contracts/stats.ts` | Per-status counts, signed totals per currency for a Brazilian year |
| `lib/contracts/template.ts` | Titles, `issuerLegal()`, `renderContractBody()` in pt/en/es |
| `lib/format.ts` (modify) | `formatTimestamp` |
| `lib/quotes/visitor-context.ts` (modify) | `clientIp` |
| `lib/telegram.ts` | `notifyTelegram` moved out of a `'use server'` file |
| `lib/auth/require-owner.ts` | Session check for dashboard actions |
| `lib/quotes/code.ts` (modify) | Generic `nextSequentialCode` |
| `lib/contracts/queries.ts` | Reads |
| `lib/contracts/actions.ts` | Dashboard actions (owner only) |
| `lib/contracts/sign-action.ts` | Public `signContract` |
| `lib/contracts/fonts.ts` | Source Serif 4 + JetBrains Mono CSS variables |
| `components/contracts/*` | Status badge, generate button, editor, regenerate dialog, void button, evidence panel, body renderer, sign form |
| `components/quotes/activity/copy-link-button.tsx` (modify) | Support `/c/` links and icon-only mode |
| `app/dashboard/contracts/page.tsx` | List |
| `app/dashboard/contracts/[id]/page.tsx` | Editor / signed view |
| `app/c/[slug]/page.tsx` | Public page |
| `app/dashboard/layout.tsx`, `components/dashboard/nav-link.tsx`, `app/dashboard/[id]/page.tsx` (modify) | Nav + quote entry point |
| `tailwind.config.ts`, `app/globals.css` (modify) | Font utilities, contract body styles |

---

### Task 1: Contracts table and migration

**Files:**
- Modify: `lib/db/schema.ts` (append at end of file)
- Create: `drizzle/0011_<generated>.sql`, `drizzle/meta/0011_snapshot.json`, `drizzle/meta/_journal.json` (generated)

**Interfaces:**
- Produces: `contracts` table object, `contractStatus` enum, `contractsRelations`, types `Contract` (`typeof contracts.$inferSelect`) and `ContractStatus` (`'draft' | 'sent' | 'signed' | 'void'`). Column names (camelCase in TS) used by every later task: `id, quoteId, slug, code, status, language, quoteCode, customerName, customerCompany, customerEmail, currency, totalCents, body, issuerName, issuerDocument, issuerAddress, sentAt, signerName, signerDocumentType, signerDocument, signerAddress, signerIp, signerUserAgent, signedAt, signedHash, createdAt, updatedAt`.

- [ ] **Step 1: Append the schema**

Add to the end of `lib/db/schema.ts` (`sql`, `relations`, `uniqueIndex`, `index`, `pgEnum`, `pgTable`, `uuid`, `varchar`, `text`, `integer`, `timestamp` are already imported at the top of the file):

```ts
export const contractStatus = pgEnum('contract_status', [
  'draft',
  'sent',
  'signed',
  'void',
])

// A self-contained snapshot: body, totals and both parties' legal data are
// copied in, so later quote edits or env changes never alter a contract.
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Set null, not cascade: a signed contract must survive its quote.
    quoteId: uuid('quote_id').references(() => quotes.id, {
      onDelete: 'set null',
    }),
    slug: varchar('slug', { length: 24 }).notNull(),
    code: varchar('code', { length: 16 }).notNull(),
    status: contractStatus('status').notNull().default('draft'),
    language: varchar('language', { length: 2 }).notNull().default('pt'),
    quoteCode: varchar('quote_code', { length: 16 }),
    customerName: text('customer_name').notNull(),
    customerCompany: text('customer_company'),
    customerEmail: text('customer_email'),
    currency: varchar('currency', { length: 3 }).notNull(),
    totalCents: integer('total_cents').notNull(),
    body: text('body').notNull(),
    issuerName: text('issuer_name').notNull(),
    issuerDocument: text('issuer_document').notNull(),
    issuerAddress: text('issuer_address').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    signerName: text('signer_name'),
    // cpf | cnpj | other
    signerDocumentType: varchar('signer_document_type', { length: 8 }),
    signerDocument: text('signer_document'),
    signerAddress: text('signer_address'),
    signerIp: text('signer_ip'),
    signerUserAgent: text('signer_user_agent'),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    signedHash: varchar('signed_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    slugIdx: uniqueIndex('contracts_slug_idx').on(table.slug),
    codeIdx: uniqueIndex('contracts_code_idx').on(table.code),
    // At most one live contract per quote; voided ones don't count.
    quoteActiveIdx: uniqueIndex('contracts_quote_active_idx')
      .on(table.quoteId)
      .where(sql`${table.status} <> 'void'`),
    createdAtIdx: index('contracts_created_at_idx').on(table.createdAt),
  }),
)

export const contractsRelations = relations(contracts, ({ one }) => ({
  quote: one(quotes, {
    fields: [contracts.quoteId],
    references: [quotes.id],
  }),
}))

export type Contract = typeof contracts.$inferSelect
export type ContractStatus = (typeof contractStatus.enumValues)[number]
```

- [ ] **Step 2: Generate the migration**

Run: `pnpm db:generate`
Expected: a new `drizzle/0011_<random_name>.sql`, plus `drizzle/meta/0011_snapshot.json` and an updated `drizzle/meta/_journal.json`. No DB connection is needed for `generate`.

- [ ] **Step 3: Check the generated SQL**

Run: `grep -E "CREATE TYPE|CREATE TABLE|contracts_quote_active_idx|ON DELETE" drizzle/0011_*.sql`
Expected, among others:
- `CREATE TYPE "public"."contract_status" AS ENUM('draft', 'sent', 'signed', 'void');`
- `CREATE TABLE "contracts" (`
- a `FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null` line
- `CREATE UNIQUE INDEX "contracts_quote_active_idx" ON "contracts" USING btree ("quote_id") WHERE "contracts"."status" <> 'void';`

If the partial index lacks the `WHERE` clause, stop: the `.where()` call did not apply.

- [ ] **Step 4: Typecheck and tests**

Run: `pnpm exec tsc --noEmit -p . && pnpm test`
Expected: typecheck clean, 91 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(db): add contracts table"
```

---

### Task 2: Signer document validation

**Files:**
- Create: `lib/contracts/document.ts`, `lib/contracts/validation.ts`
- Test: `lib/contracts/document.test.ts`, `lib/contracts/validation.test.ts`

**Interfaces:**
- Produces (`document.ts`): `SIGNER_DOCUMENT_TYPES = ['cpf', 'cnpj', 'other'] as const`; `type SignerDocumentType`; `isValidCpf(value: string): boolean` and `isValidCnpj(value: string): boolean` (expect normalized input); `normalizeDocument(type: SignerDocumentType, value: string): string`; `formatDocument(type: string | null, value: string | null): string`; `documentLine(type: string | null, value: string | null): string`.
- Produces (`validation.ts`): `type SignErrorKey = 'required' | 'tooLong' | 'invalidDocument' | 'mustAgree' | 'invalid'`; `type SignField = 'name' | 'documentType' | 'document' | 'address' | 'agree' | 'versionHash'`; `signPayloadSchema` (output: `{ name, documentType, document (normalized), address, agree: true, versionHash }`); `type SignPayload`; `firstErrors(error: z.ZodError): Partial<Record<SignField, SignErrorKey>>`; `contractBodySchema` (trimmed string, 1 to 100 000 chars).

- [ ] **Step 1: Write the failing document tests**

`lib/contracts/document.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  documentLine,
  formatDocument,
  isValidCnpj,
  isValidCpf,
  normalizeDocument,
} from '@/lib/contracts/document'

describe('isValidCpf', () => {
  it('accepts valid CPFs', () => {
    expect(isValidCpf('52998224725')).toBe(true)
    expect(isValidCpf('12345678909')).toBe(true)
  })

  it('rejects wrong check digits, repeated digits and wrong lengths', () => {
    expect(isValidCpf('52998224724')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('5299822472')).toBe(false)
    // Expects normalized input.
    expect(isValidCpf('529.982.247-25')).toBe(false)
  })
})

describe('isValidCnpj', () => {
  it('accepts numeric and alphanumeric CNPJs', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
    expect(isValidCnpj('12ABC34501DE35')).toBe(true)
  })

  it('rejects wrong check digits, repeated digits and bad shapes', () => {
    expect(isValidCnpj('11222333000182')).toBe(false)
    expect(isValidCnpj('00000000000000')).toBe(false)
    expect(isValidCnpj('12ABC34501DE3X')).toBe(false)
    expect(isValidCnpj('1122233300018')).toBe(false)
  })
})

describe('normalizeDocument', () => {
  it('keeps CPF digits only', () => {
    expect(normalizeDocument('cpf', ' 529.982.247-25 ')).toBe('52998224725')
  })

  it('uppercases CNPJ and drops punctuation', () => {
    expect(normalizeDocument('cnpj', '12.abc.345/01de-35')).toBe(
      '12ABC34501DE35',
    )
  })

  it('trims and collapses whitespace for other documents', () => {
    expect(normalizeDocument('other', '  X  1234567 ')).toBe('X 1234567')
  })
})

describe('formatDocument', () => {
  it('formats CPF and CNPJ', () => {
    expect(formatDocument('cpf', '52998224725')).toBe('529.982.247-25')
    expect(formatDocument('cnpj', '12ABC34501DE35')).toBe('12.ABC.345/01DE-35')
  })

  it('passes other documents through and handles empty values', () => {
    expect(formatDocument('other', 'X1234567')).toBe('X1234567')
    expect(formatDocument('cpf', null)).toBe('')
  })
})

describe('documentLine', () => {
  it('prefixes Brazilian documents with their type', () => {
    expect(documentLine('cpf', '52998224725')).toBe('CPF 529.982.247-25')
    expect(documentLine('cnpj', '11222333000181')).toBe(
      'CNPJ 11.222.333/0001-81',
    )
    expect(documentLine('other', 'X1234567')).toBe('X1234567')
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `pnpm test lib/contracts/document.test.ts`
Expected: FAIL, cannot resolve `@/lib/contracts/document`.

- [ ] **Step 3: Implement `lib/contracts/document.ts`**

```ts
export const SIGNER_DOCUMENT_TYPES = ['cpf', 'cnpj', 'other'] as const
export type SignerDocumentType = (typeof SIGNER_DOCUMENT_TYPES)[number]

// Check digit shared by CPF and CNPJ: weighted sum mod 11. Each character
// counts as its char code minus 48, which keeps digits as-is and covers the
// alphanumeric CNPJ issued since July 2026.
function checkDigit(chars: string, weights: number[]) {
  const sum = weights.reduce(
    (acc, weight, i) => acc + (chars.charCodeAt(i) - 48) * weight,
    0,
  )
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

const CPF_WEIGHTS_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2]
const CPF_WEIGHTS_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

export function isValidCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false
  return (
    checkDigit(value, CPF_WEIGHTS_1) === Number(value[9]) &&
    checkDigit(value, CPF_WEIGHTS_2) === Number(value[10])
  )
}

export function isValidCnpj(value: string) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(value) || /^(\d)\1{13}$/.test(value)) {
    return false
  }
  return (
    checkDigit(value, CNPJ_WEIGHTS_1) === Number(value[12]) &&
    checkDigit(value, CNPJ_WEIGHTS_2) === Number(value[13])
  )
}

// What gets stored: CPF as 11 digits, CNPJ as 14 uppercase characters, any
// other document trimmed with inner whitespace collapsed.
export function normalizeDocument(type: SignerDocumentType, value: string) {
  if (type === 'cpf') return value.replace(/\D/g, '')
  if (type === 'cnpj') return value.toUpperCase().replace(/[^0-9A-Z]/g, '')
  return value.trim().replace(/\s+/g, ' ')
}

export function formatDocument(type: string | null, value: string | null) {
  if (!value) return ''
  if (type === 'cpf' && value.length === 11) {
    return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`
  }
  if (type === 'cnpj' && value.length === 14) {
    return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`
  }
  return value
}

// "CPF 529.982.247-25", "CNPJ 11.222.333/0001-81", or the foreign ID as-is.
export function documentLine(type: string | null, value: string | null) {
  const formatted = formatDocument(type, value)
  return type === 'cpf' || type === 'cnpj'
    ? `${type.toUpperCase()} ${formatted}`
    : formatted
}
```

- [ ] **Step 4: Run document tests**

Run: `pnpm test lib/contracts/document.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing validation tests**

`lib/contracts/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { firstErrors, signPayloadSchema } from '@/lib/contracts/validation'

const valid = {
  name: 'Helena Costa Ribeiro',
  documentType: 'cpf',
  document: '529.982.247-25',
  address: 'Rua das Flores, 120 — Curitiba/PR',
  agree: true,
  versionHash: 'a'.repeat(64),
}

function errorsFor(input: Record<string, unknown>) {
  const result = signPayloadSchema.safeParse(input)
  if (result.success) throw new Error('expected validation to fail')
  return firstErrors(result.error)
}

describe('signPayloadSchema', () => {
  it('accepts a punctuated CPF and stores digits only', () => {
    const result = signPayloadSchema.parse({
      ...valid,
      document: ' 529.982.247-25 ',
    })
    expect(result.document).toBe('52998224725')
    expect(result.name).toBe('Helena Costa Ribeiro')
  })

  it('accepts a lowercase alphanumeric CNPJ and stores it uppercase', () => {
    const result = signPayloadSchema.parse({
      ...valid,
      documentType: 'cnpj',
      document: '12.abc.345/01de-35',
    })
    expect(result.document).toBe('12ABC34501DE35')
  })

  it('accepts any non-empty foreign document', () => {
    const result = signPayloadSchema.parse({
      ...valid,
      documentType: 'other',
      document: '  X  1234567 ',
    })
    expect(result.document).toBe('X 1234567')
  })

  it('rejects a CPF with a wrong check digit', () => {
    expect(errorsFor({ ...valid, document: '529.982.247-24' })).toEqual({
      document: 'invalidDocument',
    })
  })

  it('rejects whitespace-only fields as required', () => {
    expect(errorsFor({ ...valid, name: '   ', address: '\n' })).toEqual({
      name: 'required',
      address: 'required',
    })
  })

  it('treats missing form fields as required', () => {
    expect(errorsFor({ ...valid, name: null })).toEqual({ name: 'required' })
  })

  it('rejects overlong fields', () => {
    expect(errorsFor({ ...valid, name: 'a'.repeat(201) })).toEqual({
      name: 'tooLong',
    })
  })

  it('requires the agreement box', () => {
    expect(errorsFor({ ...valid, agree: false })).toEqual({
      agree: 'mustAgree',
    })
  })

  it('rejects a malformed version hash', () => {
    expect(errorsFor({ ...valid, versionHash: 'abc' })).toEqual({
      versionHash: 'invalid',
    })
  })
})
```

- [ ] **Step 6: Run to see it fail**

Run: `pnpm test lib/contracts/validation.test.ts`
Expected: FAIL, cannot resolve `@/lib/contracts/validation`.

- [ ] **Step 7: Implement `lib/contracts/validation.ts`**

```ts
import { z } from 'zod'
import {
  SIGNER_DOCUMENT_TYPES,
  isValidCnpj,
  isValidCpf,
  normalizeDocument,
} from '@/lib/contracts/document'

// Messages are keys; the public page translates them per contract language.
export type SignErrorKey =
  | 'required'
  | 'tooLong'
  | 'invalidDocument'
  | 'mustAgree'
  | 'invalid'

export type SignField =
  | 'name'
  | 'documentType'
  | 'document'
  | 'address'
  | 'agree'
  | 'versionHash'

const requiredText = (max: number) =>
  z
    .string({ required_error: 'required', invalid_type_error: 'required' })
    .trim()
    .min(1, 'required')
    .max(max, 'tooLong')

export const signPayloadSchema = z
  .object({
    name: requiredText(200),
    documentType: z.enum(SIGNER_DOCUMENT_TYPES, {
      errorMap: () => ({ message: 'invalid' }),
    }),
    document: requiredText(40),
    address: requiredText(300),
    agree: z.literal(true, { errorMap: () => ({ message: 'mustAgree' }) }),
    versionHash: z
      .string({ required_error: 'invalid', invalid_type_error: 'invalid' })
      .regex(/^[0-9a-f]{64}$/, 'invalid'),
  })
  .transform(d => ({
    ...d,
    document: normalizeDocument(d.documentType, d.document),
  }))
  .superRefine((d, ctx) => {
    const valid =
      d.documentType === 'cpf'
        ? isValidCpf(d.document)
        : d.documentType === 'cnpj'
          ? isValidCnpj(d.document)
          : d.document.length > 0
    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document'],
        message: 'invalidDocument',
      })
    }
  })

export type SignPayload = z.infer<typeof signPayloadSchema>

// First error per field, keyed by field name.
export function firstErrors(error: z.ZodError) {
  const errors: Partial<Record<SignField, SignErrorKey>> = {}
  for (const issue of error.issues) {
    const field = issue.path[0] as SignField
    errors[field] ??= issue.message as SignErrorKey
  }
  return errors
}

export const contractBodySchema = z.string().trim().min(1).max(100_000)
```

- [ ] **Step 8: Run all tests**

Run: `pnpm test && pnpm exec tsc --noEmit -p .`
Expected: all pass, typecheck clean.

- [ ] **Step 9: Commit**

```bash
git add lib/contracts/document.ts lib/contracts/document.test.ts lib/contracts/validation.ts lib/contracts/validation.test.ts
git commit -m "feat(contracts): validate signer CPF, CNPJ and form fields"
```

---

### Task 3: Status rules, hashing and stats

**Files:**
- Create: `lib/contracts/status.ts`, `lib/contracts/hash.ts`, `lib/contracts/stats.ts`
- Test: `lib/contracts/status.test.ts`, `lib/contracts/hash.test.ts`, `lib/contracts/stats.test.ts`

**Interfaces:**
- Consumes: `Contract`, `ContractStatus` types (Task 1).
- Produces (`status.ts`): `canTransition(from: ContractStatus, to: ContractStatus): boolean`; `sourcesOf(to: ContractStatus): ContractStatus[]`; `EDITABLE_STATUSES: ContractStatus[]` (`['draft', 'sent']`); `isEditable(status: ContractStatus): boolean`; `CONTRACT_STATUS_BADGES: Record<ContractStatus, { label: string; className: string }>`.
- Produces (`hash.ts`): `type VersionFields`, `versionHash(c: VersionFields): string`; `type SignedFields`, `signedHash(c: SignedFields): string` (64 hex chars each).
- Produces (`stats.ts`): `type StatsRow = { status: ContractStatus; currency: string; totalCents: number; signedAt: Date | null }`; `brazilYear(date: Date): number`; `summarizeContracts(rows: StatsRow[], year: number): { counts: Record<ContractStatus, number>; signedTotals: { currency: string; totalCents: number }[] }`.

- [ ] **Step 1: Write the failing status tests**

`lib/contracts/status.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { canTransition, isEditable, sourcesOf } from '@/lib/contracts/status'
import type { ContractStatus } from '@/lib/db/schema'

const ALL: ContractStatus[] = ['draft', 'sent', 'signed', 'void']

describe('canTransition', () => {
  it('allows exactly the four lifecycle moves', () => {
    const allowed = ALL.flatMap(from =>
      ALL.filter(to => canTransition(from, to)).map(to => `${from}->${to}`),
    )
    expect(allowed).toEqual([
      'draft->sent',
      'draft->void',
      'sent->signed',
      'sent->void',
    ])
  })

  it('never leaves signed or void', () => {
    expect(ALL.some(to => canTransition('signed', to))).toBe(false)
    expect(ALL.some(to => canTransition('void', to))).toBe(false)
  })
})

describe('sourcesOf', () => {
  it('lists the statuses each move may start from', () => {
    expect(sourcesOf('sent')).toEqual(['draft'])
    expect(sourcesOf('signed')).toEqual(['sent'])
    expect(sourcesOf('void')).toEqual(['draft', 'sent'])
    expect(sourcesOf('draft')).toEqual([])
  })
})

describe('isEditable', () => {
  it('allows edits only before signing', () => {
    expect(ALL.filter(isEditable)).toEqual(['draft', 'sent'])
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `pnpm test lib/contracts/status.test.ts`
Expected: FAIL, cannot resolve `@/lib/contracts/status`.

- [ ] **Step 3: Implement `lib/contracts/status.ts`**

```ts
import type { ContractStatus } from '@/lib/db/schema'

const NEXT: Record<ContractStatus, readonly ContractStatus[]> = {
  draft: ['sent', 'void'],
  sent: ['signed', 'void'],
  signed: [],
  void: [],
}

export function canTransition(from: ContractStatus, to: ContractStatus) {
  return NEXT[from].includes(to)
}

// Statuses a contract may be in for a move to `to`. Actions put this in the
// UPDATE's WHERE, so the check and the write are one atomic statement.
export function sourcesOf(to: ContractStatus) {
  return (Object.keys(NEXT) as ContractStatus[]).filter(from =>
    canTransition(from, to),
  )
}

export const EDITABLE_STATUSES: ContractStatus[] = ['draft', 'sent']

export function isEditable(status: ContractStatus) {
  return EDITABLE_STATUSES.includes(status)
}

export const CONTRACT_STATUS_BADGES: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Rascunho',
    className: 'border-slate-300 bg-white text-slate-700',
  },
  sent: {
    label: 'Aguardando assinatura',
    className: 'border-orange-200 bg-orange-50 text-orange-800',
  },
  signed: {
    label: 'Assinado',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  void: {
    label: 'Anulado',
    className: 'border-slate-200 bg-slate-50 text-slate-500 line-through',
  },
}
```

- [ ] **Step 4: Run status tests**

Run: `pnpm test lib/contracts/status.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing hash tests**

`lib/contracts/hash.test.ts`:

```ts
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
```

- [ ] **Step 6: Run to see it fail**

Run: `pnpm test lib/contracts/hash.test.ts`
Expected: FAIL, cannot resolve `@/lib/contracts/hash`.

- [ ] **Step 7: Implement `lib/contracts/hash.ts`**

```ts
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
```

- [ ] **Step 8: Run hash tests**

Run: `pnpm test lib/contracts/hash.test.ts`
Expected: PASS.

- [ ] **Step 9: Write the failing stats tests**

`lib/contracts/stats.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { brazilYear, summarizeContracts } from '@/lib/contracts/stats'

describe('brazilYear', () => {
  it('uses São Paulo time at the year boundary', () => {
    // Dec 31, 22:00 in São Paulo.
    expect(brazilYear(new Date('2027-01-01T01:00:00Z'))).toBe(2026)
    expect(brazilYear(new Date('2027-01-01T03:00:00Z'))).toBe(2027)
  })
})

describe('summarizeContracts', () => {
  it('counts every status and sums signed totals per currency for the year', () => {
    const result = summarizeContracts(
      [
        { status: 'draft', currency: 'BRL', totalCents: 100_000, signedAt: null },
        { status: 'sent', currency: 'BRL', totalCents: 200_000, signedAt: null },
        { status: 'signed', currency: 'BRL', totalCents: 350_000, signedAt: new Date('2026-09-29T15:00:00Z') },
        { status: 'signed', currency: 'BRL', totalCents: 240_000, signedAt: new Date('2027-01-01T01:00:00Z') },
        { status: 'signed', currency: 'USD', totalCents: 120_000, signedAt: new Date('2026-09-22T12:18:00Z') },
        { status: 'signed', currency: 'BRL', totalCents: 999_900, signedAt: new Date('2025-12-31T12:00:00Z') },
        { status: 'void', currency: 'BRL', totalCents: 240_000, signedAt: null },
      ],
      2026,
    )
    expect(result.counts).toEqual({ draft: 1, sent: 1, signed: 4, void: 1 })
    expect(result.signedTotals).toEqual([
      { currency: 'BRL', totalCents: 590_000 },
      { currency: 'USD', totalCents: 120_000 },
    ])
  })

  it('returns zero counts and no totals for no contracts', () => {
    expect(summarizeContracts([], 2026)).toEqual({
      counts: { draft: 0, sent: 0, signed: 0, void: 0 },
      signedTotals: [],
    })
  })
})
```

- [ ] **Step 10: Run to see it fail**

Run: `pnpm test lib/contracts/stats.test.ts`
Expected: FAIL, cannot resolve `@/lib/contracts/stats`.

- [ ] **Step 11: Implement `lib/contracts/stats.ts`**

```ts
import type { ContractStatus } from '@/lib/db/schema'

export type StatsRow = {
  status: ContractStatus
  currency: string
  totalCents: number
  signedAt: Date | null
}

// Calendar year in Brazil time, so a contract signed on Dec 31 at 22:00 in
// São Paulo (already Jan 1 in UTC) counts toward the year it was signed in.
export function brazilYear(date: Date) {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date),
  )
}

export function summarizeContracts(rows: StatsRow[], year: number) {
  const counts: Record<ContractStatus, number> = {
    draft: 0,
    sent: 0,
    signed: 0,
    void: 0,
  }
  const signed = new Map<string, number>()
  for (const row of rows) {
    counts[row.status] += 1
    if (
      row.status === 'signed' &&
      row.signedAt &&
      brazilYear(row.signedAt) === year
    ) {
      signed.set(row.currency, (signed.get(row.currency) ?? 0) + row.totalCents)
    }
  }
  return {
    counts,
    signedTotals: [...signed].map(([currency, totalCents]) => ({
      currency,
      totalCents,
    })),
  }
}
```

- [ ] **Step 12: Run all tests and typecheck**

Run: `pnpm test && pnpm exec tsc --noEmit -p .`
Expected: all pass, typecheck clean.

- [ ] **Step 13: Commit**

```bash
git add lib/contracts/status.ts lib/contracts/status.test.ts lib/contracts/hash.ts lib/contracts/hash.test.ts lib/contracts/stats.ts lib/contracts/stats.test.ts
git commit -m "feat(contracts): add lifecycle rules, hashing and stats"
```

---

### Task 4: Contract template

**Files:**
- Create: `lib/contracts/template.ts`
- Test: `lib/contracts/template.test.ts`

**Interfaces:**
- Consumes: `formatMoney`, `formatDate`, `LANGUAGE_LOCALES` (`lib/format.ts`); `computeTotals`, `TotalsInput` (`lib/quotes/totals.ts`); `ISSUER` (`lib/quotes/issuer.ts`); `QuoteLanguage` (`lib/quotes/validation.ts`).
- Produces: `CONTRACT_TITLES: Record<QuoteLanguage, string>`; `type IssuerLegal = { name: string; document: string; address: string; city: string }`; `issuerLegal(): IssuerLegal` (throws `Error('Missing issuer legal data')`); `type ContractTemplateInput = { language: QuoteLanguage; quoteCode: string; quoteIssueDate: string; scope: string | null; items: Array<TotalsInput & { description: string }>; discountCents: number; currency: string; deliveryEstimate: string | null; payment: string | null; issuerCity: string }`; `renderContractBody(input: ContractTemplateInput): string`.

- [ ] **Step 1: Write the failing tests**

`lib/contracts/template.test.ts`:

```ts
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
    { description: 'Links e páginas extras', quantity: '2', unitPriceCents: 20_000 },
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
        { description: 'Logo | ícone\nfavicon', quantity: '1', unitPriceCents: 10_000 },
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
```

- [ ] **Step 2: Run to see it fail**

Run: `pnpm test lib/contracts/template.test.ts`
Expected: FAIL, cannot resolve `@/lib/contracts/template`.

- [ ] **Step 3: Implement `lib/contracts/template.ts`**

```ts
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
```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test && pnpm exec tsc --noEmit -p .`
Expected: all pass, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/contracts/template.ts lib/contracts/template.test.ts
git commit -m "feat(contracts): add pt, en and es contract template"
```

---

### Task 5: Shared helpers (timestamps, client IP, Telegram, owner check, codes)

**Files:**
- Modify: `lib/format.ts`, `lib/format.test.ts`, `lib/quotes/visitor-context.ts`, `lib/quotes/visitor-context.test.ts`, `lib/quotes/request-actions.ts`, `lib/quotes/code.ts`
- Create: `lib/telegram.ts`, `lib/auth/require-owner.ts`

**Interfaces:**
- Produces: `formatTimestamp(value: Date | string | null | undefined, locale?: Locale, withTime?: boolean): string`; `clientIp(headers: Headers): string | null`; `notifyTelegram(text: string): Promise<void>` from `@/lib/telegram`; `requireOwner(): Promise<void>` from `@/lib/auth/require-owner` (throws `Error('Unauthorized')`); `nextSequentialCode(table: PgTable, column: PgColumn, prefix: string, date: string | Date): Promise<string>` from `@/lib/quotes/code`. `nextQuoteCode(issueDate)` keeps its behavior.

- [ ] **Step 1: Write the failing `formatTimestamp` tests**

Append to `lib/format.test.ts` (and add `formatTimestamp` to its import from `@/lib/format`):

```ts
describe('formatTimestamp', () => {
  it('shows Brazil time regardless of the server time zone', () => {
    expect(formatTimestamp(new Date('2026-10-07T18:42:00Z'))).toContain(
      '15:42',
    )
    expect(formatTimestamp('2026-10-07T18:42:00Z', 'en-US')).toContain('3:42')
  })

  it('keeps the Brazilian date across midnight UTC', () => {
    expect(
      formatTimestamp(new Date('2026-10-08T01:30:00Z'), 'pt-BR', false),
    ).toBe('7 de out. de 2026')
  })

  it('returns an empty string without a value', () => {
    expect(formatTimestamp(null)).toBe('')
  })
})
```

- [ ] **Step 2: Write the failing `clientIp` tests**

Append to `lib/quotes/visitor-context.test.ts` (and add `clientIp` to its import):

```ts
describe('clientIp', () => {
  it('takes the first hop of x-forwarded-for', () => {
    expect(
      clientIp(new Headers({ 'x-forwarded-for': ' 189.6.24.117 , 10.0.0.1' })),
    ).toBe('189.6.24.117')
  })

  it('falls back to x-real-ip', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '73.162.40.8' }))).toBe(
      '73.162.40.8',
    )
  })

  it('returns null without either header', () => {
    expect(clientIp(new Headers())).toBeNull()
    expect(clientIp(new Headers({ 'x-forwarded-for': ' ' }))).toBeNull()
  })
})
```

- [ ] **Step 3: Run to see them fail**

Run: `pnpm test lib/format.test.ts lib/quotes/visitor-context.test.ts`
Expected: FAIL, `formatTimestamp` / `clientIp` is not exported.

- [ ] **Step 4: Implement both helpers**

Append to `lib/format.ts`:

```ts
// Timestamps (timestamptz) render in Brazil time; the server runs in UTC.
export function formatTimestamp(
  value: Date | string | null | undefined,
  locale: Locale = 'pt-BR',
  withTime = true,
) {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(withTime && { timeStyle: 'short' }),
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
}
```

Append to `lib/quotes/visitor-context.ts`:

```ts
// On Vercel the first x-forwarded-for hop is the client.
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || null
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm test lib/format.test.ts lib/quotes/visitor-context.test.ts`
Expected: PASS.

- [ ] **Step 6: Move `notifyTelegram` to `lib/telegram.ts`**

Create `lib/telegram.ts` with the function body cut from `lib/quotes/request-actions.ts` (now exported, log message made generic):

```ts
// Plain module on purpose: exported from a 'use server' file this would
// become a publicly callable server action.
// Callers have already saved their data, so a failed alert is only logged.
export async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Plain text (no parse_mode): messages can include visitor input.
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(5000),
      },
    )
    if (!res.ok) {
      console.error('Telegram alert failed', res.status, await res.text())
    }
  } catch (error) {
    console.error('Telegram alert failed', error)
  }
}
```

In `lib/quotes/request-actions.ts`: delete the local `notifyTelegram` function and its preceding comment (`// The request is already saved, so a failed alert is only logged.`), and add `import { notifyTelegram } from '@/lib/telegram'` with the other imports. The call site `after(() => notifyTelegram(text))` stays unchanged.

- [ ] **Step 7: Add `lib/auth/require-owner.ts`**

```ts
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

// Server action endpoints can be called directly, outside the /dashboard
// middleware, so owner-only actions check the session themselves.
export async function requireOwner() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) throw new Error('Unauthorized')
}
```

- [ ] **Step 8: Generalize the code sequence in `lib/quotes/code.ts`**

Replace the whole file with:

```ts
import { desc, like } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import { quotes } from '@/lib/db/schema'

function codeYear(date: string | Date | null | undefined) {
  if (date instanceof Date) return date.getFullYear()
  if (typeof date === 'string') {
    const year = Number(date.slice(0, 4))
    if (Number.isInteger(year) && year > 0) return year
  }
  return new Date().getFullYear()
}

// PREFIX-YYYY-NNN, continuing from the highest code issued that year.
export async function nextSequentialCode(
  table: PgTable,
  column: PgColumn,
  prefix: string,
  date: string | Date,
) {
  const start = `${prefix}-${codeYear(date)}-`
  const [latest] = await db
    .select({ code: column })
    .from(table)
    .where(like(column, `${start}%`))
    .orderBy(desc(column))
    .limit(1)

  const next = latest ? Number(String(latest.code).slice(start.length)) + 1 : 1
  return `${start}${String(next).padStart(3, '0')}`
}

export function nextQuoteCode(issueDate: string | Date) {
  return nextSequentialCode(quotes, quotes.code, 'LA', issueDate)
}
```

- [ ] **Step 9: Tests and typecheck**

Run: `pnpm test && pnpm exec tsc --noEmit -p .`
Expected: all pass, typecheck clean. If `select({ code: column })` fails to typecheck, type the column parameter as `PgColumn<any>`; do not change call sites.

- [ ] **Step 10: Commit**

```bash
git add lib/format.ts lib/format.test.ts lib/quotes/visitor-context.ts lib/quotes/visitor-context.test.ts lib/telegram.ts lib/quotes/request-actions.ts lib/auth/require-owner.ts lib/quotes/code.ts
git commit -m "refactor: share Telegram alerts, sequential codes and owner checks"
```

---

### Task 6: Contract queries and dashboard actions

**Files:**
- Create: `lib/contracts/queries.ts`, `lib/contracts/actions.ts`

**Interfaces:**
- Consumes: Task 1 schema; `sourcesOf`, `EDITABLE_STATUSES`, `isEditable` (Task 3); `summarizeContracts`, `brazilYear` (Task 3); `issuerLegal`, `renderContractBody` (Task 4); `contractBodySchema` (Task 2); `requireOwner`, `nextSequentialCode` (Task 5); `getQuoteById`, `QuoteWithItems` (`lib/quotes/queries.ts`); `quoteLanguage` (`lib/quotes/language.ts`); `LANGUAGES`, `QuoteLanguage` (`lib/quotes/validation.ts`).
- Produces (`queries.ts`): `type ContractFilter = 'open' | 'signed'`; `listContracts(filter?: ContractFilter): Promise<Contract[]>`; `getContractById(id: string)`; `getContractBySlug(slug: string)` (both `Promise<Contract | undefined>`); `getLiveContractForQuote(quoteId: string): Promise<{ id: string; status: ContractStatus } | undefined>`; `listQuotesWithoutContract(): Promise<QuoteWithItems[]>`; `contractStats(): Promise<ReturnType<typeof summarizeContracts>>`.
- Produces (`actions.ts`, all `'use server'`, all owner-only): `createContractFromQuote(quoteId: string): Promise<{ ok: true; id: string } | { ok: false; error: string }>`; `updateContractBody(id: string, body: string): Promise<{ ok: true } | { ok: false; error: string }>`; `regenerateContract(id: string, language: QuoteLanguage)` (same result type); `sendContract(id: string): Promise<{ ok: true; slug: string } | { ok: false; error: string }>`; `voidContract(id: string)` (`{ ok: true } | { ok: false; error }`).

No unit tests here: every function is a thin DB wrapper over logic already tested in Tasks 2 to 4. Verified by typecheck now and by the manual checklist in Task 11.

- [ ] **Step 1: Implement `lib/contracts/queries.ts`**

```ts
import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { summarizeContracts, brazilYear } from '@/lib/contracts/stats'
import { db } from '@/lib/db'
import { contracts, quotes, type ContractStatus } from '@/lib/db/schema'

export type ContractFilter = 'open' | 'signed'

const FILTER_STATUSES: Record<ContractFilter, ContractStatus[]> = {
  open: ['draft', 'sent'],
  signed: ['signed'],
}

export function listContracts(filter?: ContractFilter) {
  return db.query.contracts.findMany({
    where: filter ? inArray(contracts.status, FILTER_STATUSES[filter]) : undefined,
    orderBy: [desc(contracts.createdAt)],
  })
}

export function getContractById(id: string) {
  return db.query.contracts.findFirst({ where: eq(contracts.id, id) })
}

export function getContractBySlug(slug: string) {
  return db.query.contracts.findFirst({ where: eq(contracts.slug, slug) })
}

// The quote's non-void contract, if any (at most one, by unique index).
export function getLiveContractForQuote(quoteId: string) {
  return db.query.contracts.findFirst({
    where: and(eq(contracts.quoteId, quoteId), ne(contracts.status, 'void')),
    columns: { id: true, status: true },
  })
}

export async function listQuotesWithoutContract() {
  const [accepted, live] = await Promise.all([
    db.query.quotes.findMany({
      where: eq(quotes.status, 'accepted'),
      orderBy: [desc(quotes.updatedAt)],
      with: { items: true },
    }),
    db
      .select({ quoteId: contracts.quoteId })
      .from(contracts)
      .where(ne(contracts.status, 'void')),
  ])
  const taken = new Set(live.map(row => row.quoteId))
  return accepted.filter(quote => !taken.has(quote.id))
}

export async function contractStats() {
  const rows = await db
    .select({
      status: contracts.status,
      currency: contracts.currency,
      totalCents: contracts.totalCents,
      signedAt: contracts.signedAt,
    })
    .from(contracts)
  return summarizeContracts(rows, brazilYear(new Date()))
}
```

- [ ] **Step 2: Implement `lib/contracts/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireOwner } from '@/lib/auth/require-owner'
import {
  getContractById,
  getLiveContractForQuote,
} from '@/lib/contracts/queries'
import { EDITABLE_STATUSES, isEditable, sourcesOf } from '@/lib/contracts/status'
import { issuerLegal, renderContractBody } from '@/lib/contracts/template'
import { contractBodySchema } from '@/lib/contracts/validation'
import { db } from '@/lib/db'
import { contracts } from '@/lib/db/schema'
import { nextSequentialCode } from '@/lib/quotes/code'
import { quoteLanguage } from '@/lib/quotes/language'
import { getQuoteById, type QuoteWithItems } from '@/lib/quotes/queries'
import { computeTotals } from '@/lib/quotes/totals'
import { LANGUAGES, type QuoteLanguage } from '@/lib/quotes/validation'

type Failure = { ok: false; error: string }

const MISSING_ISSUER =
  'Configure ISSUER_DOCUMENT, ISSUER_ADDRESS e ISSUER_CITY no ambiente'
const WRONG_STATUS = 'Status não permite esta ação'
const HAS_LIVE_CONTRACT = 'Este orçamento já tem um contrato ativo'

// Everything a contract copies from its quote and the issuer env vars.
// Throws when the issuer env vars are missing.
function snapshot(quote: QuoteWithItems, language: QuoteLanguage) {
  const issuer = issuerLegal()
  return {
    language,
    quoteCode: quote.code,
    customerName: quote.customerName,
    customerCompany: quote.customerCompany,
    customerEmail: quote.customerEmail,
    currency: quote.currency,
    totalCents: computeTotals(quote.items, quote.discountCents).totalCents,
    issuerName: issuer.name,
    issuerDocument: issuer.document,
    issuerAddress: issuer.address,
    body: renderContractBody({
      language,
      quoteCode: quote.code,
      quoteIssueDate: quote.issueDate,
      scope: quote.scope,
      items: quote.items,
      discountCents: quote.discountCents,
      currency: quote.currency,
      deliveryEstimate: quote.deliveryEstimate,
      payment: quote.payment,
      issuerCity: issuer.city,
    }),
  }
}

function revalidateContract(contract: { id: string; slug: string }) {
  revalidatePath('/dashboard/contracts')
  revalidatePath(`/dashboard/contracts/${contract.id}`)
  revalidatePath(`/c/${contract.slug}`)
}

const returning = { id: contracts.id, slug: contracts.slug }

export async function createContractFromQuote(
  quoteId: string,
): Promise<{ ok: true; id: string } | Failure> {
  await requireOwner()
  const quote = await getQuoteById(quoteId)
  if (!quote || quote.status !== 'accepted') {
    return { ok: false, error: 'O orçamento precisa estar aceito' }
  }
  if (await getLiveContractForQuote(quoteId)) {
    return { ok: false, error: HAS_LIVE_CONTRACT }
  }

  let data: ReturnType<typeof snapshot>
  try {
    data = snapshot(quote, quoteLanguage(quote.language))
  } catch {
    return { ok: false, error: MISSING_ISSUER }
  }

  try {
    const [row] = await db
      .insert(contracts)
      .values({
        ...data,
        quoteId,
        slug: nanoid(12),
        code: await nextSequentialCode(contracts, contracts.code, 'CT', new Date()),
      })
      .returning(returning)
    revalidateContract(row)
    revalidatePath(`/dashboard/${quoteId}`)
    return { ok: true, id: row.id }
  } catch (error) {
    // Most likely a double click racing past the live-contract check; the
    // partial unique index rejected the second insert.
    console.error('createContractFromQuote failed', error)
    return { ok: false, error: 'Não foi possível criar o contrato' }
  }
}

export async function updateContractBody(
  id: string,
  body: string,
): Promise<{ ok: true } | Failure> {
  await requireOwner()
  const parsed = contractBodySchema.safeParse(body)
  if (!parsed.success) {
    return { ok: false, error: 'O texto do contrato não pode ficar vazio' }
  }
  const [row] = await db
    .update(contracts)
    .set({ body: parsed.data, updatedAt: new Date() })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, EDITABLE_STATUSES)),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true }
}

export async function regenerateContract(
  id: string,
  language: QuoteLanguage,
): Promise<{ ok: true } | Failure> {
  await requireOwner()
  if (!LANGUAGES.includes(language)) {
    return { ok: false, error: 'Idioma inválido' }
  }
  const contract = await getContractById(id)
  if (!contract || !isEditable(contract.status)) {
    return { ok: false, error: WRONG_STATUS }
  }
  const quote = contract.quoteId
    ? await getQuoteById(contract.quoteId)
    : undefined
  if (!quote) return { ok: false, error: 'O orçamento de origem foi excluído' }

  let data: ReturnType<typeof snapshot>
  try {
    data = snapshot(quote, language)
  } catch {
    return { ok: false, error: MISSING_ISSUER }
  }

  const [row] = await db
    .update(contracts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, EDITABLE_STATUSES)),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true }
}

export async function sendContract(
  id: string,
): Promise<{ ok: true; slug: string } | Failure> {
  await requireOwner()
  const now = new Date()
  const [row] = await db
    .update(contracts)
    .set({ status: 'sent', sentAt: now, updatedAt: now })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, sourcesOf('sent'))),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true, slug: row.slug }
}

export async function voidContract(
  id: string,
): Promise<{ ok: true } | Failure> {
  await requireOwner()
  const [row] = await db
    .update(contracts)
    .set({ status: 'void', updatedAt: new Date() })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, sourcesOf('void'))),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true }
}
```

Why the status lives in each `WHERE`: a client signing at the same moment holds the row lock; when the owner's UPDATE runs after the signature commits, Postgres re-checks the `WHERE`, finds `signed`, and updates nothing. No separate read-then-write window.

- [ ] **Step 3: Typecheck and tests**

Run: `pnpm exec tsc --noEmit -p . && pnpm test`
Expected: clean, all pass. Note `LANGUAGES.includes(language)` may need `(LANGUAGES as readonly string[]).includes(language)` to typecheck; use that form if needed.

- [ ] **Step 4: Commit**

```bash
git add lib/contracts/queries.ts lib/contracts/actions.ts
git commit -m "feat(contracts): add queries and dashboard actions"
```

---

### Task 7: Public sign action

**Files:**
- Create: `lib/contracts/sign-action.ts`

**Interfaces:**
- Consumes: `signPayloadSchema`, `firstErrors`, `SignErrorKey`, `SignField` (Task 2); `versionHash`, `signedHash` (Task 3); `clientIp`, `notifyTelegram` (Task 5).
- Produces: `type SignState = { status: 'idle' } | { status: 'signed' } | { status: 'error'; error: 'invalid' | 'changed' | 'not-signable'; fieldErrors?: Partial<Record<SignField, SignErrorKey>> }`; `signContract(slug: string, formData: FormData): Promise<SignState>`. Form field names: `name`, `documentType`, `document`, `address`, `agree` (checkbox, value `on`), `versionHash`.

- [ ] **Step 1: Implement `lib/contracts/sign-action.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck and tests**

Run: `pnpm exec tsc --noEmit -p . && pnpm test`
Expected: clean, all pass. If `.for('update')` is reported as missing on the select builder, check `node_modules/drizzle-orm/pg-core/query-builders/select.d.ts` for the lock method name (it is `for(strength, config?)` in drizzle-orm 0.45).

- [ ] **Step 3: Commit**

```bash
git add lib/contracts/sign-action.ts
git commit -m "feat(contracts): add public sign action with row lock and version check"
```

---

### Task 8: Contract list page, navigation and quote entry point

**Files:**
- Create: `lib/contracts/fonts.ts`, `components/contracts/contract-status-badge.tsx`, `components/contracts/generate-contract-button.tsx`, `app/dashboard/contracts/page.tsx`
- Modify: `tailwind.config.ts`, `components/quotes/activity/copy-link-button.tsx`, `app/dashboard/layout.tsx`, `components/dashboard/nav-link.tsx`, `app/dashboard/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 6 queries and `createContractFromQuote`; `CONTRACT_STATUS_BADGES` (Task 3); `formatTimestamp` (Task 5).
- Produces: `contractFonts: string` (class names that define `--font-contract-serif` and `--font-contract-mono`) from `@/lib/contracts/fonts`; Tailwind utilities `font-contract-serif`, `font-contract-mono` (only work inside an element carrying `contractFonts`); `<ContractStatusBadge status />`; `<GenerateContractButton quoteId variant? />`; `CopyLinkButton` props `{ slug: string; base?: '/q' | '/c'; label?: string; iconOnly?: boolean; size?: 'sm' | 'default' }`.

- [ ] **Step 1: Fonts and Tailwind utilities**

Create `lib/contracts/fonts.ts`:

```ts
import { JetBrains_Mono, Source_Serif_4 } from 'next/font/google'

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-contract-serif',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-contract-mono',
  display: 'swap',
})

// Put on a contract page's root; enables font-contract-serif/-mono inside.
export const contractFonts = `${serif.variable} ${mono.variable}`
```

In `tailwind.config.ts`, inside `theme.extend`, add right before the `borderRadius: {` line:

```ts
      fontFamily: {
        'contract-serif': ['var(--font-contract-serif)', 'Georgia', 'serif'],
        'contract-mono': ['var(--font-contract-mono)', 'ui-monospace', 'monospace'],
      },
```

- [ ] **Step 2: Status badge and generate button**

`components/contracts/contract-status-badge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'
import { CONTRACT_STATUS_BADGES } from '@/lib/contracts/status'
import type { ContractStatus } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const badge = CONTRACT_STATUS_BADGES[status]
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', badge.className)}>
      {badge.label}
    </Badge>
  )
}
```

`components/contracts/generate-contract-button.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileSignature } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createContractFromQuote } from '@/lib/contracts/actions'

export function GenerateContractButton({
  quoteId,
  variant = 'default',
}: {
  quoteId: string
  variant?: 'default' | 'outline'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant={variant}
      className="gap-2"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await createContractFromQuote(quoteId)
          if (!res.ok) {
            toast.error(res.error)
            return
          }
          toast.success('Contrato criado')
          router.push(`/dashboard/contracts/${res.id}`)
        })
      }
    >
      <FileSignature className="size-4" /> Gerar contrato
    </Button>
  )
}
```

- [ ] **Step 3: Generalize `CopyLinkButton`**

Replace `components/quotes/activity/copy-link-button.tsx` with (existing `<CopyLinkButton slug={…} />` calls keep working):

```tsx
'use client'

import { Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({
  slug,
  base = '/q',
  label = 'Copiar link público',
  iconOnly = false,
  size = 'default',
}: {
  slug: string
  base?: '/q' | '/c'
  label?: string
  iconOnly?: boolean
  size?: 'sm' | 'default'
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${base}/${slug}`,
      )
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  if (iconOnly) {
    return (
      <Button variant="ghost" size="icon" aria-label={label} onClick={copy}>
        <Link2 className="size-4" />
      </Button>
    )
  }
  return (
    <Button variant="outline" size={size} className="gap-2" onClick={copy}>
      <Copy className="size-4" /> {label}
    </Button>
  )
}
```

- [ ] **Step 4: Navigation**

In `app/dashboard/layout.tsx`, between the Financeiro and Mensagens links:

```tsx
            <NavLink href="/dashboard/finances">Financeiro</NavLink>
            <NavLink href="/dashboard/contracts">Contratos</NavLink>
```

In `components/dashboard/nav-link.tsx`, replace the `active` computation:

```ts
  const active =
    href === '/dashboard'
      ? !['/dashboard/requests', '/dashboard/finances', '/dashboard/contracts'].some(
          prefix => pathname.startsWith(prefix),
        )
      : pathname.startsWith(href)
```

- [ ] **Step 5: List page `app/dashboard/contracts/page.tsx`**

```tsx
import Link from 'next/link'
import {
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileEdit,
  Pencil,
} from 'lucide-react'
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge'
import { GenerateContractButton } from '@/components/contracts/generate-contract-button'
import { StatCard } from '@/components/dashboard/stat-card'
import { CopyLinkButton } from '@/components/quotes/activity/copy-link-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { contractFonts } from '@/lib/contracts/fonts'
import {
  type ContractFilter,
  contractStats,
  listContracts,
  listQuotesWithoutContract,
} from '@/lib/contracts/queries'
import { formatMoney, formatTimestamp } from '@/lib/format'
import {
  QUOTE_LANGUAGE_LABELS,
  quoteLanguage,
  quoteLocale,
} from '@/lib/quotes/language'
import { computeTotals } from '@/lib/quotes/totals'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const FILTERS: { key?: ContractFilter; label: string; href: string }[] = [
  { label: 'Todos', href: '/dashboard/contracts' },
  { key: 'open', label: 'Abertos', href: '/dashboard/contracts?status=open' },
  { key: 'signed', label: 'Assinados', href: '/dashboard/contracts?status=signed' },
]

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter =
    status === 'open' || status === 'signed' ? status : undefined
  const [rows, pending, stats] = await Promise.all([
    listContracts(filter),
    listQuotesWithoutContract(),
    contractStats(),
  ])
  const signedValue =
    stats.signedTotals
      .map(s => formatMoney(s.totalCents, s.currency, 'pt-BR'))
      .join(' · ') || '—'

  return (
    <div className={cn(contractFonts, 'space-y-6')}>
      <div>
        <p className="font-contract-mono text-xs text-muted-foreground">
          &gt; contratos
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight">
          Contratos
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Gerados a partir de orçamentos aceitos. O cliente assina pelo link.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rascunhos" value={stats.counts.draft} icon={FileEdit} />
        <StatCard
          label="Aguardando assinatura"
          value={stats.counts.sent}
          icon={Clock}
        />
        <StatCard
          label="Assinados"
          value={stats.counts.signed}
          icon={CheckCircle2}
        />
        <StatCard
          label="Valor assinado no ano"
          value={signedValue}
          icon={Banknote}
        />
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <span className="size-2 rounded-full bg-orange-600" aria-hidden />
              Orçamentos aceitos sem contrato
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {pending.length} pronto{pending.length > 1 ? 's' : ''} para gerar
            </span>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {pending.map(quote => {
              const lang = quoteLanguage(quote.language)
              const { totalCents } = computeTotals(
                quote.items,
                quote.discountCents,
              )
              return (
                <div
                  key={quote.id}
                  className="flex flex-wrap items-center gap-4 px-6 py-3.5"
                >
                  <span className="min-w-[6.5rem] font-contract-mono text-[13px] text-slate-600">
                    {quote.code}
                  </span>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-sm font-medium">{quote.customerName}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {[quote.customerCompany, QUOTE_LANGUAGE_LABELS[lang]]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(totalCents, quote.currency, quoteLocale(lang))}
                  </span>
                  <GenerateContractButton quoteId={quote.id} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Todos os contratos</CardTitle>
          <nav
            aria-label="Filtrar por status"
            className="inline-flex gap-0.5 rounded-lg bg-muted p-1"
          >
            {FILTERS.map(f => (
              <Link
                key={f.label}
                href={f.href}
                aria-current={filter === f.key ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium',
                  filter === f.key
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum contrato aqui ainda. Gere um a partir de um orçamento
              aceito.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Assinado</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[8rem] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(contract => {
                  const lang = quoteLanguage(contract.language)
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="whitespace-nowrap font-contract-mono text-[13px]">
                        {contract.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {contract.customerName}
                        </div>
                        {contract.customerCompany && (
                          <div className="text-sm text-muted-foreground">
                            {contract.customerCompany}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <ContractStatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {QUOTE_LANGUAGE_LABELS[lang]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatTimestamp(contract.sentAt, 'pt-BR', false) || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatTimestamp(contract.signedAt, 'pt-BR', false) ||
                          '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                        {formatMoney(
                          contract.totalCents,
                          contract.currency,
                          quoteLocale(lang),
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {contract.status !== 'draft' && (
                            <CopyLinkButton
                              slug={contract.slug}
                              base="/c"
                              label="Copiar link de assinatura"
                              iconOnly
                            />
                          )}
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="Abrir página pública"
                          >
                            <Link href={`/c/${contract.slug}`} target="_blank">
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="Abrir contrato"
                          >
                            <Link href={`/dashboard/contracts/${contract.id}`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Quote detail entry point**

In `app/dashboard/[id]/page.tsx`:

1. Add imports: `FileSignature` to the `lucide-react` import list; `import { GenerateContractButton } from '@/components/contracts/generate-contract-button'`; `import { getLiveContractForQuote } from '@/lib/contracts/queries'`.
2. Replace the data load with:

```tsx
  const [quote, events, liveContract] = await Promise.all([
    getQuoteById(id),
    listQuoteEvents(id),
    getLiveContractForQuote(id),
  ])
```

3. Right after the existing "Editar" button block

```tsx
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/dashboard/${quote.id}/edit`}>
                  <Pencil className="size-4" /> Editar
                </Link>
              </Button>
```

add:

```tsx
              {liveContract ? (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/dashboard/contracts/${liveContract.id}`}>
                    <FileSignature className="size-4" /> Ver contrato
                  </Link>
                </Button>
              ) : (
                quote.status === 'accepted' && (
                  <GenerateContractButton quoteId={quote.id} variant="outline" />
                )
              )}
```

and change that buttons container from `<div className="flex gap-2">` to `<div className="flex flex-wrap gap-2">` so three buttons wrap on phones.

- [ ] **Step 7: Typecheck, tests, build with placeholder env**

Run: `pnpm exec tsc --noEmit -p . && pnpm test`
Expected: clean, all pass.

Run: `DATABASE_URL=postgres://user:pass@127.0.0.1:5432/none DASHBOARD_PASSWORD=x pnpm build`
Expected: build succeeds and lists `ƒ /dashboard/contracts` (dynamic). The placeholder URL is never connected to because every page here is `force-dynamic`. If the build fails on an unrelated pre-existing page, run the same command on `main` (`git stash; git checkout main; …`) to confirm it is pre-existing, and note it in the task report.

- [ ] **Step 8: Commit**

```bash
git add lib/contracts/fonts.ts tailwind.config.ts components/contracts/contract-status-badge.tsx components/contracts/generate-contract-button.tsx components/quotes/activity/copy-link-button.tsx app/dashboard/layout.tsx components/dashboard/nav-link.tsx app/dashboard/contracts/page.tsx "app/dashboard/[id]/page.tsx"
git commit -m "feat(contracts): add contracts list, nav link and quote entry point"
```

---

### Task 9: Contract editor and signed view

**Files:**
- Create: `components/contracts/contract-body.tsx`, `components/contracts/contract-editor.tsx`, `components/contracts/regenerate-dialog.tsx`, `components/contracts/void-contract-button.tsx`, `components/contracts/evidence-panel.tsx`, `app/dashboard/contracts/[id]/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 6 actions and `getContractById`; `CONTRACT_TITLES` (Task 4); `documentLine` (Task 2); `isEditable` (Task 3); `formatTimestamp` (Task 5); `contractFonts`, `ContractStatusBadge`, `CopyLinkButton` (Task 8); `Markdown` (`components/quotes/markdown.tsx`).
- Produces: `<ContractBody body />` (used again by Task 10), the CSS class `.contract-body`.

- [ ] **Step 1: Contract body renderer and styles**

`components/contracts/contract-body.tsx`:

```tsx
import { Markdown } from '@/components/quotes/markdown'

// Clause text as the client reads it; used by the editor preview, the
// dashboard's signed view and the public page.
export function ContractBody({ body }: { body: string }) {
  return <Markdown content={body} className="contract-body font-contract-serif" />
}
```

Append to `app/globals.css` (after the existing `.md` rules, so these win):

```css
/* Contract text: dashboard preview and /c/[slug]. */
.contract-body {
  font-size: 1rem;
  line-height: 1.7;
  color: #1e293b;
}
.contract-body h2 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 1.6em 0 0.35em;
}
.contract-body p {
  margin: 0 0 0.75em;
}
.contract-body table {
  width: 100%;
  margin: 0.75em 0 1em;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}
.contract-body th,
.contract-body td {
  border: 0;
  border-bottom: 1px solid hsl(var(--border));
  padding: 0.45em 0.25em;
}
.contract-body th {
  text-align: left;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}
```

- [ ] **Step 2: Editor component `components/contracts/contract-editor.tsx`**

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Send } from 'lucide-react'
import { toast } from 'sonner'
import { ContractBody } from '@/components/contracts/contract-body'
import { CopyLinkButton } from '@/components/quotes/activity/copy-link-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sendContract, updateContractBody } from '@/lib/contracts/actions'
import type { ContractStatus } from '@/lib/db/schema'

export function ContractEditor({
  id,
  slug,
  code,
  status,
  title,
  initialBody,
}: {
  id: string
  slug: string
  code: string
  status: ContractStatus
  title: string
  initialBody: string
}) {
  const router = useRouter()
  const [body, setBody] = useState(initialBody)
  const [savedBody, setSavedBody] = useState(initialBody)
  const [isPending, startTransition] = useTransition()
  const dirty = body !== savedBody

  // A regenerate replaces the server body; adopt it.
  useEffect(() => {
    setBody(initialBody)
    setSavedBody(initialBody)
  }, [initialBody])

  // Don't lose typed clauses to an accidental tab close.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = async () => {
    const res = await updateContractBody(id, body)
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    setSavedBody(body)
    return true
  }

  const onSave = () =>
    startTransition(async () => {
      if (await save()) {
        toast.success('Contrato salvo')
        router.refresh()
      }
    })

  const onSend = () =>
    startTransition(async () => {
      if (dirty && !(await save())) return
      const res = await sendContract(id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/c/${res.slug}`,
        )
        toast.success('Contrato enviado. Link copiado.')
      } catch {
        toast.success('Contrato enviado. Use “Copiar link” para compartilhar.')
      }
      router.refresh()
    })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="mr-auto text-xs text-muted-foreground">
          {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!dirty || isPending}
          onClick={onSave}
        >
          Salvar
        </Button>
        {status === 'draft' ? (
          <Button
            size="sm"
            className="gap-2"
            disabled={isPending}
            onClick={onSend}
          >
            <Send className="size-4" /> Enviar para assinatura
          </Button>
        ) : (
          <CopyLinkButton slug={slug} base="/c" label="Copiar link" size="sm" />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col overflow-hidden">
          <div className="flex h-11 items-center border-b px-4">
            <Label htmlFor="contract-body" className="text-[13px]">
              Texto do contrato{' '}
              <span className="font-normal text-muted-foreground">
                · markdown
              </span>
            </Label>
          </div>
          <Textarea
            id="contract-body"
            value={body}
            onChange={e => setBody(e.target.value)}
            spellCheck={false}
            className="min-h-[640px] flex-1 resize-y rounded-none border-0 font-contract-mono text-[13px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <p className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Partes e bloco de assinatura são gerados automaticamente; não
            precisam estar no texto.
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex h-11 items-center justify-between border-b px-4">
            <h2 className="text-[13px] font-semibold">Pré-visualização</h2>
            <span className="text-xs text-muted-foreground">
              como o cliente verá
            </span>
          </div>
          <article className="px-6 py-7 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contrato · {code}
            </p>
            <h3 className="mb-5 mt-2 font-contract-serif text-[22px] font-bold leading-tight text-slate-900">
              {title}
            </h3>
            <ContractBody body={body} />
          </article>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Regenerate dialog `components/contracts/regenerate-dialog.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { regenerateContract } from '@/lib/contracts/actions'
import { QUOTE_LANGUAGE_LABELS } from '@/lib/quotes/language'
import { LANGUAGES, type QuoteLanguage } from '@/lib/quotes/validation'

export function RegenerateDialog({
  id,
  language,
}: {
  id: string
  language: QuoteLanguage
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<QuoteLanguage>(language)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RotateCcw className="size-4" /> Regenerar do modelo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerar do modelo?</DialogTitle>
          <DialogDescription>
            O texto volta ao modelo padrão com os dados atuais do orçamento.
            Suas edições serão perdidas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="regenerate-language">Idioma</Label>
          <Select
            value={lang}
            onValueChange={value => setLang(value as QuoteLanguage)}
          >
            <SelectTrigger id="regenerate-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => (
                <SelectItem key={l} value={l}>
                  {QUOTE_LANGUAGE_LABELS[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await regenerateContract(id, lang)
                if (!res.ok) {
                  toast.error(res.error)
                  return
                }
                toast.success('Contrato regenerado')
                setOpen(false)
                router.refresh()
              })
            }
          >
            Regenerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Void button `components/contracts/void-contract-button.tsx`**

```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { voidContract } from '@/lib/contracts/actions'

export function VoidContractButton({ id, code }: { id: string; code: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          Anular
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular contrato {code}?</AlertDialogTitle>
          <AlertDialogDescription>
            O link deixa de aceitar assinaturas e o cliente verá o contrato como
            cancelado. Você poderá gerar um novo contrato a partir do
            orçamento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await voidContract(id)
                if (!res.ok) {
                  toast.error(res.error)
                  return
                }
                toast.success('Contrato anulado')
                router.refresh()
              })
            }
          >
            Anular
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 5: Evidence panel `components/contracts/evidence-panel.tsx`**

```tsx
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { documentLine } from '@/lib/contracts/document'
import type { Contract } from '@/lib/db/schema'
import { formatTimestamp } from '@/lib/format'

export function EvidencePanel({ contract }: { contract: Contract }) {
  const rows: [string, string][] = [
    ['Assinado por', contract.signerName ?? '—'],
    [
      'Documento',
      documentLine(contract.signerDocumentType, contract.signerDocument) || '—',
    ],
    ['Endereço', contract.signerAddress ?? '—'],
    ['Assinado em', formatTimestamp(contract.signedAt) || '—'],
    ['Enviado em', formatTimestamp(contract.sentAt) || '—'],
    ['IP', contract.signerIp ?? '—'],
    ['Navegador', contract.signerUserAgent ?? '—'],
  ]

  return (
    <Card className="border-emerald-200">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <ShieldCheck className="size-5 text-emerald-700" />
        <CardTitle className="text-base">Registro da assinatura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-lg bg-slate-900 px-4 py-3 text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            SHA-256
          </p>
          <code className="mt-1 block break-all font-contract-mono text-xs">
            {contract.signedHash}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 6: Page `app/dashboard/contracts/[id]/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
import { ContractBody } from '@/components/contracts/contract-body'
import { ContractEditor } from '@/components/contracts/contract-editor'
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge'
import { EvidencePanel } from '@/components/contracts/evidence-panel'
import { RegenerateDialog } from '@/components/contracts/regenerate-dialog'
import { VoidContractButton } from '@/components/contracts/void-contract-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { contractFonts } from '@/lib/contracts/fonts'
import { getContractById } from '@/lib/contracts/queries'
import { isEditable } from '@/lib/contracts/status'
import { CONTRACT_TITLES } from '@/lib/contracts/template'
import { formatMoney } from '@/lib/format'
import {
  QUOTE_LANGUAGE_LABELS,
  quoteLanguage,
  quoteLocale,
} from '@/lib/quotes/language'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const contract = await getContractById(id)
  if (!contract) notFound()

  const lang = quoteLanguage(contract.language)
  const editable = isEditable(contract.status)
  const title = CONTRACT_TITLES[lang]
  const meta = [
    {
      label: 'Orçamento',
      value: contract.quoteId ? (
        <Link
          href={`/dashboard/${contract.quoteId}`}
          className="font-contract-mono text-[13px] underline-offset-4 hover:underline"
        >
          {contract.quoteCode}
        </Link>
      ) : (
        <span className="font-contract-mono text-[13px]">
          {contract.quoteCode ?? '—'}
        </span>
      ),
    },
    {
      label: 'Valor',
      value: formatMoney(contract.totalCents, contract.currency, quoteLocale(lang)),
    },
    { label: 'Idioma', value: QUOTE_LANGUAGE_LABELS[lang] },
    {
      label: 'Contratante',
      value: contract.signerName ?? 'Preenchido na assinatura',
    },
  ]

  return (
    <div className={cn(contractFonts, 'space-y-5')}>
      <Link
        href="/dashboard/contracts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Contratos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-contract-mono text-xl font-medium tracking-tight">
              {contract.code}
            </h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {[contract.customerName, contract.customerCompany]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <VoidContractButton id={contract.id} code={contract.code} />
          )}
          {editable && <RegenerateDialog id={contract.id} language={lang} />}
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/c/${contract.slug}`} target="_blank">
              <Eye className="size-4" /> Visualizar
            </Link>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
        {meta.map(m => (
          <div key={m.label} className="bg-background px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {m.label}
            </dt>
            <dd className="mt-1 text-sm font-medium">{m.value}</dd>
          </div>
        ))}
      </dl>

      {editable ? (
        <ContractEditor
          id={contract.id}
          slug={contract.slug}
          code={contract.code}
          status={contract.status}
          title={title}
          initialBody={contract.body}
        />
      ) : (
        <>
          {contract.status === 'signed' && <EvidencePanel contract={contract} />}
          <Card className="px-6 py-8 sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contrato · {contract.code}
            </p>
            <h2 className="mb-6 mt-2 font-contract-serif text-2xl font-bold leading-tight text-slate-900">
              {title}
            </h2>
            <ContractBody body={contract.body} />
          </Card>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Typecheck, tests, build**

Run: `pnpm exec tsc --noEmit -p . && pnpm test`
Expected: clean, all pass.

Run: `DATABASE_URL=postgres://user:pass@127.0.0.1:5432/none DASHBOARD_PASSWORD=x pnpm build`
Expected: succeeds; lists `ƒ /dashboard/contracts/[id]`.

- [ ] **Step 8: Commit**

```bash
git add components/contracts/ app/globals.css "app/dashboard/contracts/[id]/page.tsx"
git commit -m "feat(contracts): add contract editor and signed view"
```

---

### Task 10: Public contract page and sign form

**Files:**
- Create: `components/contracts/sign-form.tsx`, `app/c/[slug]/page.tsx`

**Interfaces:**
- Consumes: `signContract`, `SignState` (Task 7); `versionHash` (Task 3); `SIGNER_DOCUMENT_TYPES`, `SignerDocumentType`, `documentLine` (Task 2); `SignErrorKey` (Task 2); `CONTRACT_TITLES` (Task 4); `formatTimestamp` (Task 5); `contractFonts`, `ContractBody` (Tasks 8–9); `getContractBySlug` (Task 6); `ISSUER`, `PrintButton`, `verifySessionToken`, `SESSION_COOKIE` (existing).
- Produces: `type SignFormLabels`; `<SignForm action versionHash labels />` where `action: (formData: FormData) => Promise<SignState>`.

- [ ] **Step 1: Sign form `components/contracts/sign-form.tsx`**

```tsx
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
            aria-describedby={documentError ? 'signer-document-error' : undefined}
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
```

- [ ] **Step 2: Public page `app/c/[slug]/page.tsx`**

```tsx
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
        changed:
          'Este contrato fue actualizado. Recarga la página para leer la versión más reciente.',
        'not-signable':
          'Este contrato ya no puede firmarse. Recarga la página.',
      },
    },
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const contract = await getContractBySlug(slug)
  const robots = { index: false, follow: false }
  if (!contract || contract.status === 'draft') {
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
  if (contract.status === 'draft' && !isOwner) notFound()

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
```

- [ ] **Step 3: Typecheck, tests, build**

Run: `pnpm exec tsc --noEmit -p . && pnpm test`
Expected: clean, all pass.

Run: `DATABASE_URL=postgres://user:pass@127.0.0.1:5432/none DASHBOARD_PASSWORD=x pnpm build`
Expected: succeeds; lists `ƒ /c/[slug]`. Check the build output does not show `/c/[slug]` bundling `lib/contracts/actions.ts` (it must only reference `sign-action`): `grep -rl "createContractFromQuote" .next/server/app/c 2>/dev/null` prints nothing.

- [ ] **Step 4: Commit**

```bash
git add components/contracts/sign-form.tsx "app/c/[slug]/page.tsx"
git commit -m "feat(contracts): add public contract page with online signing"
```

---

### Task 11: Final verification and handoff notes

**Files:**
- None created. Possibly small fixes from what the checks find.

- [ ] **Step 1: Full automated check**

Run: `pnpm test && pnpm exec tsc --noEmit -p . && DATABASE_URL=postgres://user:pass@127.0.0.1:5432/none DASHBOARD_PASSWORD=x pnpm build`
Expected: all tests pass (91 baseline + the new suites), typecheck clean, build succeeds with `/dashboard/contracts`, `/dashboard/contracts/[id]` and `/c/[slug]` listed.

- [ ] **Step 2: Lint the touched files**

Run: `pnpm lint`
Expected: no new errors in `lib/contracts`, `components/contracts`, `app/c`, `app/dashboard/contracts`. Pre-existing warnings elsewhere are out of scope.

- [ ] **Step 3: Confirm no attribution slipped in**

Run: `git log main..HEAD --format=%B | grep -iE "co-authored|generated with|claude" ; echo "exit=$?"`
Expected: no matches (`exit=1`).

- [ ] **Step 4: Write the manual checklist into the task report**

The engineer cannot run these (no local DB). Report them to the owner verbatim; they run after the migration is applied (production deploys run migrations; preview deploys deliberately do not):

1. Set `ISSUER_DOCUMENT`, `ISSUER_ADDRESS`, `ISSUER_CITY` in Vercel (Production).
2. On an accepted quote, click "Gerar contrato"; the editor opens with eight clauses, the items table and the right total.
3. Edit a clause, Salvar, reload: the edit persists. Close the tab with unsaved text: the browser warns.
4. Regenerar in English: body switches language and the edit is gone.
5. Open `/c/<slug>` in a private window while the contract is a draft: 404.
6. Enviar para assinatura: link copied; the private window now shows the form.
7. In the dashboard, edit and save the body again; in the private window, submit the form: "This contract was updated…" banner; reload and sign: success.
8. Try a bad CPF (`529.982.247-24`): field error, typed values stay.
9. Signed page shows both signature cards, the SHA-256 strip and Brazil-time timestamps; print preview includes them and hides the toolbar.
10. Dashboard signed view shows the evidence panel; the list shows "Assinado" and the year's signed value; Telegram alert arrives.
11. Try to Anular or edit a signed contract: the buttons are gone; the quote page shows "Ver contrato".
12. Delete a quote that has a signed contract: the contract page and `/c/<slug>` still work.

- [ ] **Step 5: Hand off**

Use superpowers:finishing-a-development-branch. The PR description must list the three new env vars and the migration, and must not contain attribution lines.
