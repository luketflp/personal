# Contracts — design spec

Date: 2026-10-07
Status: approved design, pending implementation plan
UI reference: Claude Design canvas "Contratos — Dashboard" (https://claude.ai/artifact/Xg7gBSB7WRuuhBLLJDRacD), four artboards: list, editor, public signing page, signed state on mobile.

## Goal

Generate a service contract from an accepted quote, edit it in the dashboard, send the client a link, and let the client sign it online. The signed contract is immutable, carries an audit trail (who, when, IP, user agent) and a SHA-256 fingerprint, and prints to PDF from the browser.

## Decisions

| Topic | Decision |
|---|---|
| Source | Contracts are created only from quotes with status `accepted`. |
| Signing | Click-to-sign on a public page `/c/[slug]`. The client enters their legal data, ticks an agreement box and signs. Server records timestamp, IP, user agent and a SHA-256 hash. |
| Clauses | One default template per language, in code. On create, it renders to a markdown body with quote data baked in. The body is then freely editable until signed. |
| Languages | pt, en, es (the languages the website supports). Defaults to the quote's language. Governing law is Brazilian in all three. |
| Client legal data | Filled by the client on the signing page (legal name, document type and number, address). |
| Contractor signature | Sending the contract counts as the contractor's signature; `sent_at` is recorded and shown. |
| Issuer legal data | Env vars, because the repo is public: `ISSUER_DOCUMENT`, `ISSUER_ADDRESS`, `ISSUER_CITY`. Name, title, email and photo keep coming from `lib/quotes/issuer.ts`. |
| PDF | Browser print, same as quotes. No server-side PDF. |
| Notification | Telegram alert when a client signs. No email. |

## Non-goals

- Multiple signers per contract.
- Visitor tracking on contract pages (the quote tracker is not reused).
- Email delivery.
- A clause library or a template editor in the dashboard.
- Server-side PDF generation or file storage.

## Data model

New enum and table in `lib/db/schema.ts`, migration generated with `pnpm db:generate`.

```ts
export const contractStatus = pgEnum('contract_status', [
  'draft',
  'sent',
  'signed',
  'void',
])

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Nullable + set null: the contract is a self-contained snapshot and must
    // survive the quote being deleted.
    quoteId: uuid('quote_id').references(() => quotes.id, {
      onDelete: 'set null',
    }),
    slug: varchar('slug', { length: 24 }).notNull(),
    code: varchar('code', { length: 16 }).notNull(), // CT-2026-001
    status: contractStatus('status').notNull().default('draft'),
    language: varchar('language', { length: 2 }).notNull().default('pt'),

    // Snapshot from the quote at create/regenerate time.
    quoteCode: varchar('quote_code', { length: 16 }),
    customerName: text('customer_name').notNull(),
    customerCompany: text('customer_company'),
    customerEmail: text('customer_email'),
    currency: varchar('currency', { length: 3 }).notNull(),
    totalCents: integer('total_cents').notNull(),
    body: text('body').notNull(),

    // Snapshot of issuer legal data at create/regenerate time, so the signed
    // hash can be recomputed even if the env vars change later.
    issuerName: text('issuer_name').notNull(),
    issuerDocument: text('issuer_document').notNull(),
    issuerAddress: text('issuer_address').notNull(),

    sentAt: timestamp('sent_at', { withTimezone: true }),

    signerName: text('signer_name'),
    signerDocumentType: varchar('signer_document_type', { length: 8 }), // cpf | cnpj | other
    signerDocument: text('signer_document'),
    signerAddress: text('signer_address'),
    signerIp: text('signer_ip'),
    signerUserAgent: text('signer_user_agent'),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    signedHash: varchar('signed_hash', { length: 64 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
```

Plus `contractsRelations` (one quote) and exported types `Contract`, `ContractStatus`.

## Lifecycle

```
            send               sign (client)
  draft ───────────▶ sent ───────────────────▶ signed (final)
    │                  │
    └──── void ◀───────┘
```

- **draft**: body editable, regenerate allowed. The public page returns 404 to visitors; the logged-in owner can preview it (same owner check as `/q/[slug]`).
- **sent**: `sent_at` set; signable. Body stays editable and regenerate stays allowed. The hash guard (below) makes sure the client signs exactly what they saw.
- **signed**: final. Every write is rejected server-side, including void. See "Amending a signed contract" below.
- **void**: allowed from `draft` and `sent` only. Public page shows a "cancelled" banner and no form.

Allowed transitions live in one function, `canTransition(from, to)` in `lib/contracts/status.ts`, used by every action.

### Amending a signed contract

The partial unique index allows one non-void contract per quote, and a signed contract holds that slot permanently. Amendments are out of scope for this version: to change a signed deal, create a new quote, accept it, and generate a contract from it. Revisit if it comes up in practice.

## Contract code

`lib/quotes/code.ts` gets a generic `nextSequentialCode({ table, column, prefix, date })`. `nextQuoteCode` keeps its signature and calls it with prefix `LA`. Contracts call it with prefix `CT` and today's date, giving `CT-2026-001`, `CT-2026-002`, …

## Template

`lib/contracts/template.ts`

- `CONTRACT_TITLES: Record<QuoteLanguage, string>`: "Contrato de Prestação de Serviços de Desenvolvimento Web", "Web Development Services Agreement", "Contrato de Prestación de Servicios de Desarrollo Web". Rendered by the page, not stored in the body.
- `renderContractBody(input): string` where `input` is `{ language, quoteCode, quoteIssueDate, scope, items, discountCents, totalCents, currency, deliveryEstimate, payment, issuerCity }`. Returns markdown with numbered clauses:
  1. Object (references the quote code)
  2. Scope and deliverables (quote `scope` text, then a GFM table of items, discount if any, and total)
  3. Timeline (quote `deliveryEstimate`, or a bracketed placeholder if empty)
  4. Price and payment (total, then quote `payment` text, or a placeholder if empty)
  5. Obligations of the parties
  6. Intellectual property (rights transfer on full payment; portfolio use allowed)
  7. Termination (7 days notice; completed stages not refundable)
  8. Electronic signature and jurisdiction (MP 2.200-2/2001; forum of `issuerCity`)
- Money uses `formatMoney` with the language's locale. Totals come from `computeTotals`.
- Parties and the signature block are not part of the body; the page renders them from structured columns.
- `issuerLegal()` reads `ISSUER_DOCUMENT`, `ISSUER_ADDRESS`, `ISSUER_CITY` and throws `Error('Missing issuer legal data')` if any is empty. Create and regenerate surface that as a readable error in the dashboard.

The clause text is a starting draft and should be reviewed by a lawyer before real use.

## Hashing

`lib/contracts/hash.ts`, using `node:crypto` `createHash('sha256')`.

- `versionHash(contract)`: SHA-256 of `JSON.stringify([body, totalCents, currency, language, issuerDocument, issuerAddress])`. Embedded in the signing form as a hidden field.
- `signedHash(contract)`: SHA-256 of `JSON.stringify` of a fixed-order array: `code, language, body, totalCents, currency, issuerName, issuerDocument, issuerAddress, sentAt ISO, signerName, signerDocumentType, signerDocument, signerAddress, signedAt ISO`. Arrays, not objects, so key order can never drift.

## Signer validation

`lib/contracts/document.ts`

- `digitsOnly(value)`.
- `isValidCpf(value)` and `isValidCnpj(value)`: standard check-digit algorithms; reject all-same-digit sequences.
- `formatCpf`, `formatCnpj` for display.

`lib/contracts/validation.ts`: zod schemas.

- `signPayloadSchema`: `name` (1–200 chars), `documentType` (`cpf | cnpj | other`), `document` (1–40 chars; checksum-validated for cpf and cnpj via `superRefine`), `address` (1–300 chars), `agree` (literal `true`), `versionHash` (64 hex chars).
- `contractBodySchema`: `body` string, 1–100 000 chars.
- Error messages in the contract's language (the sign action receives the language from the row, not from the client).

## Server actions

Two `'use server'` files, so the public page never bundles the dashboard actions:

- `lib/contracts/actions.ts`: dashboard actions. Each one starts with `await requireOwner()`, a new helper in `lib/auth/require-owner.ts` that reads the session cookie with `cookies()` and throws unless `verifySessionToken` passes. Server action endpoints are a security boundary of their own, so this does not rely on the middleware alone. (Existing quote actions rely on the middleware only; hardening them is a separate change.)
- `lib/contracts/sign-action.ts`: `signContract`, the only public action.

| Action | Rules |
|---|---|
| `createContractFromQuote(quoteId)` | Quote must exist and be `accepted`. Renders template, snapshots issuer data. Unique-index violation (an active contract already exists) returns `{ ok: false, error: 'Este orçamento já tem um contrato ativo' }`. Returns `{ ok: true, id }`; the caller redirects to the editor. |
| `updateContractBody(id, body)` | Status `draft` or `sent`. |
| `regenerateContract(id, language)` | Status `draft` or `sent`. Re-reads the quote (error if the quote was deleted), re-renders, re-snapshots issuer data, sets language. |
| `sendContract(id)` | `draft → sent`, sets `sent_at`. Returns the slug so the client copies the link. |
| `voidContract(id)` | `draft` or `sent → void`. |
| `signContract(slug, input)` | Public. See below. |

Every write sets `updatedAt` and calls `revalidatePath` for `/dashboard/contracts`, the editor path and `/c/[slug]`.

### `signContract`

1. Parse input with `signPayloadSchema`. Invalid → `{ ok: false, error }`.
2. Transaction: `SELECT … FOR UPDATE` the row by slug.
3. Not found or status not `sent` → `{ ok: false, error: 'not-signable' }` (page shows a reload message).
4. Recompute `versionHash`; mismatch → `{ ok: false, error: 'changed' }` ("This contract was updated. Reload the page to read the latest version.").
5. Set signer fields, `signerIp` (first entry of `x-forwarded-for`, else `x-real-ip`, else null), `signerUserAgent`, `signedAt = now`, `signedHash`, status `signed`.
6. After commit, `after(() => notifyTelegram(...))` with code, client, signer name and the dashboard link.

### Telegram helper

`notifyTelegram` currently lives, unexported, in `lib/quotes/request-actions.ts`, which is a `'use server'` file. Exporting it from there would turn it into a publicly callable server action. Move it to a plain module `lib/telegram.ts` and import it from both places.

## Queries

`lib/contracts/queries.ts`

- `listContracts(filter?: 'open' | 'signed')`: newest first. `open` = draft + sent.
- `getContractById(id)`, `getContractBySlug(slug)`.
- `listQuotesWithoutContract()`: accepted quotes with no non-void contract (left join), newest first, with items for the total.
- `contractStats()`: counts per status, and signed totals for the current calendar year grouped by currency.

## Pages

### `/dashboard/contracts` (artboard 01)

- Stat cards (existing `StatCard`): Rascunhos, Aguardando assinatura, Assinados, Valor assinado no ano. The last one joins per-currency sums with " · " (for example `R$ 18.400 · US$ 3.600`).
- "Orçamentos aceitos sem contrato" card, hidden when empty: code, client, accepted language, total, "Gerar contrato" button (form posting to `createContractFromQuote`).
- "Todos os contratos" table: Código, Cliente, Status, Idioma, Enviado, Assinado, Valor, Ações (copy link, open public page, open editor).
- Status filter Todos / Abertos / Assinados as links that set `?status=`; server-side filtering, no client state.
- Empty state like the quotes page.

### `/dashboard/contracts/[id]` (artboard 02)

- UUID guard + `notFound()`, same as `/dashboard/[id]`.
- Header: back link, code, status badge, client. Toolbar depends on status:
  - draft: Anular · Regenerar do modelo · Visualizar · Salvar · Enviar para assinatura
  - sent: Anular · Regenerar do modelo · Visualizar · Salvar · Copiar link
  - signed: Visualizar · Imprimir
  - void: Visualizar
- Meta strip: quote code (links to `/dashboard/[quoteId]` when the quote still exists), value, language, contractor/client status.
- Draft and sent: `ContractEditor` client component, markdown textarea left, live preview right (existing `Markdown` component), stacked below `lg`. "Salvo há …" indicator. Unsaved-changes guard on Enviar (save first, then send).
- Regenerar: dialog with language select (defaults to the current one) and a warning that edits are lost.
- Anular: `AlertDialog` confirm.
- Signed: read-only document plus an evidence panel: signer name, document, address, signed at, IP, user agent, full SHA-256, sent at.

### Quote detail `/dashboard/[id]`

Next to "Ver público" and "Editar": "Gerar contrato" when the quote is accepted and has no live contract; "Ver contrato" when it has one.

### Navigation

- `app/dashboard/layout.tsx`: add `<NavLink href="/dashboard/contracts">Contratos</NavLink>` between Financeiro and Mensagens.
- `components/dashboard/nav-link.tsx`: the `/dashboard` (Orçamentos) active check must also exclude `/dashboard/contracts`.

### Public `/c/[slug]` (artboards 03 and 04)

- Server component, `dynamic = 'force-dynamic'`, metadata with `robots: { index: false, follow: false }`. No OG image.
- `LABELS: Record<QuoteLanguage, …>` like `app/q/[slug]/page.tsx`, covering every string on the page and in the form, plus error messages.
- Draft: `notFound()` unless the owner is logged in (owner sees a "Rascunho — não visível ao cliente" banner).
- Void: "This contract was cancelled" banner, document shown, no form.
- Layout: issuer header (photo crop, name, title, email) as on the quote page; right side shows "Contrato", code, issue date (`sent_at`, or today for an owner preview of a draft). Title from `CONTRACT_TITLES`. Reference line with quote code and total.
- Parties: contractor card from the issuer snapshot. Client card: before signing, dashed card with customer name/company and "completed at signing"; after, signer name, document (formatted), address.
- Body: `Markdown` with the contract serif font.
- Signatures section:
  - sent: `SignForm` client component. Fields: name, document type segmented control (CPF / CNPJ / Outro), document number (label, placeholder and `inputMode` follow the type), address, agreement checkbox. Submit disabled until the box is ticked; pending state while submitting. Hidden `versionHash`. Uses `useActionState`; on success `router.refresh()`. Inline errors per field; `changed` and `not-signable` errors show a banner with a reload button.
  - signed: success banner at the top of the article; two signature cards (contractor: name in serif italic + "Emitido em …"; client: name + "Assinado em … · IP …"); dark SHA-256 strip.
- Toolbar above the article: back link to the site and `PrintButton`.
- Print: toolbar and form hidden (`no-print` / `print:` variants), article full width, signed block printed.

## Typography and visual details

Follows the approved canvas:

- UI: Inter (already the app font).
- Contract body and title: Source Serif 4 via `next/font/google`, loaded only in contract pages and exposed as a CSS variable.
- Codes, document numbers and the hash: JetBrains Mono via `next/font/google`, same scope.
- Status badge colors (new `CONTRACT_STATUS_BADGES` in `lib/contracts/status.ts`, rendered through `Badge` with class overrides): draft outline slate; sent orange (`#FFF7ED` / `#9A3412`); signed emerald (`#ECFDF5` / `#065F46`); void slate with line-through.
- Language labels reuse `QUOTE_LANGUAGE_LABELS`.

## Files

New:

- `lib/contracts/{template,hash,document,validation,status,queries,actions,sign-action}.ts`
- `lib/contracts/{template,hash,document,status}.test.ts`
- `lib/telegram.ts`, `lib/auth/require-owner.ts`
- `app/dashboard/contracts/page.tsx`, `app/dashboard/contracts/[id]/page.tsx`
- `app/c/[slug]/page.tsx`
- `components/contracts/{contract-editor,sign-form,regenerate-dialog,void-contract-button,evidence-panel}.tsx`
- `drizzle/0011_*.sql` + snapshot

Changed:

- `lib/db/schema.ts`, `lib/quotes/code.ts`, `lib/quotes/request-actions.ts`
- `app/dashboard/layout.tsx`, `components/dashboard/nav-link.tsx`, `app/dashboard/[id]/page.tsx`
- `.env` documentation, if there is an env example (there is none today; list the three new vars in the PR description).

## Error handling

- Missing issuer env vars: create/regenerate return an error toast; nothing is written.
- Create on a quote that already has a live contract: unique index rejects; friendly error.
- Edit/regenerate/send/void on a contract in the wrong status: `{ ok: false, error: 'Status não permite esta ação' }`.
- Sign on a changed body: rejected with `changed`; client reloads and reads the new version.
- Double submit or two tabs signing at once: `FOR UPDATE` plus the status check means the second attempt gets `not-signable`.
- Telegram failure: logged only; the signature is already committed.

## Testing

Vitest, same style as `lib/quotes/*.test.ts`:

- `template.test.ts`: each language renders the quote code, every item, discount when present, total and the forum city; empty delivery/payment produce placeholders; missing env vars throw.
- `hash.test.ts`: stable for equal input; changes when any single field changes (body, total, signer document, signedAt).
- `document.test.ts`: valid and invalid CPF and CNPJ, including all-same-digit and wrong-length cases; formatting.
- `status.test.ts`: `canTransition` accepts the four allowed transitions and rejects everything else, including any move out of `signed`.

Manual check before merge: create from an accepted quote, edit, send, sign from a private window, verify the signed view, evidence panel, print preview, and Telegram alert; try signing after editing the body in another tab to see the `changed` error.
