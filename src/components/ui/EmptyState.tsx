import type { ReactNode } from 'react'
import iconGreen from '@/assets/logos/icon_convertix_green.png'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-6 py-10 text-center">
      <img src={iconGreen} alt="" className="mb-3 size-12 object-contain opacity-90" />
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm leading-5 text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
