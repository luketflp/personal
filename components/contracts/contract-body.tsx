import { Markdown } from '@/components/quotes/markdown'

// Clause text as the client reads it; used by the editor preview, the
// dashboard's signed view and the public page.
export function ContractBody({ body }: { body: string }) {
  return <Markdown content={body} className="contract-body font-contract-serif" />
}
