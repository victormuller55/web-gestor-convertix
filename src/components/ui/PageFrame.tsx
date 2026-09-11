import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Página que preenche a altura útil do shell, sem scroll da página. */
export function PageFill({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex h-full min-h-0 flex-col', className)}>{children}</div>
}

/** Página com scroll próprio (dashboard, perfil, etc.). */
export function PageScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('h-full min-h-0 overflow-y-auto scrollbar-thin', className)}>{children}</div>
  )
}

/** Card de listagem: toolbar fixa, corpo com scroll, footer fixo embaixo. */
export function DataTableShell({
  toolbar,
  children,
  footer,
  className,
}: {
  toolbar?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm',
        'max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none',
        className,
      )}
    >
      {toolbar != null && (
        <div className="shrink-0 border-b border-line px-4 py-3 max-md:mb-3 max-md:rounded-2xl max-md:border max-md:bg-card max-md:px-3">{toolbar}</div>
      )}
      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">{children}</div>
      {footer != null && <div className="shrink-0">{footer}</div>}
    </div>
  )
}
