import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function hasFieldValue(value: unknown) {
  if (value == null) return false
  if (Array.isArray(value)) return value.length > 0
  return String(value).length > 0
}

export function isAlwaysFloatedType(type?: string) {
  return (
    type === 'date' ||
    type === 'datetime-local' ||
    type === 'time' ||
    type === 'month' ||
    type === 'week' ||
    type === 'color'
  )
}

export function FloatLabel({
  children,
  floated,
  focused,
  error,
  textarea,
  search,
}: {
  children: ReactNode
  floated: boolean
  focused?: boolean
  error?: boolean
  textarea?: boolean
  search?: boolean
}) {
  return (
    <span
      className={cn(
        'float-label',
        floated && 'is-float',
        focused && 'is-focus',
        error && 'is-error',
        textarea && 'is-textarea',
        search && 'is-search',
      )}
    >
      {children}
    </span>
  )
}
