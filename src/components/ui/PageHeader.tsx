import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 max-w-2xl text-sm leading-5 text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap gap-2 pb-1.5 max-sm:[&_button]:w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
