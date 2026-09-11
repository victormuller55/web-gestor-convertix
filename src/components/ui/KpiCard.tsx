import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
  style,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'brand' | 'warn'
  className?: string
  style?: CSSProperties
}) {
  return (
    <article
      className={cn(
        'border border-line bg-card p-5',
        tone === 'brand' && 'border-brand/20 bg-brand-soft',
        tone === 'warn' && 'border-warn/20 bg-warn-soft',
        className,
      )}
      style={style}
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
