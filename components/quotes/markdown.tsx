import ReactMarkdown from 'react-markdown'
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
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
