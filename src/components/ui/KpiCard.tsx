import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'brand' | 'warn'
}) {
  return (
    <article
      className={cn(
        'rounded-3xl border border-line bg-card p-5 shadow-sm',
        tone === 'brand' && 'border-brand/20 bg-brand-soft',
        tone === 'warn' && 'border-warn/20 bg-warn-soft',
      )}
    >
      <div className="mb-4 flex items-center justify-between text-muted">
        <span className="text-xs font-semibold tracking-wide uppercase">{label}</span>
        {icon}
      </div>
      <div className="font-display text-2xl text-ink md:text-3xl">{value}</div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </article>
  )
}
