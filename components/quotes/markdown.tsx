import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

// Renders trusted markdown (raw HTML is not enabled, so this is safe).
// Styling lives in the `.md` block in app/globals.css so it prints cleanly.
export function Markdown({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={cn('md', className)}>
      {/* remark-breaks keeps single newlines as <br>, matching what the
          author typed in the plain textareas (e.g. •-bulleted lines). */}
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
