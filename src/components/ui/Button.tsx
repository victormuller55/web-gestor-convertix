import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'ghost-danger' | 'danger' | 'soft'
  loading?: boolean
  icon?: ReactNode
  size?: 'md' | 'sm' | 'lg'
}

export function Button({
  variant = 'primary',
  loading,
  icon,
  size = 'md',
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const isGhost = variant === 'ghost' || variant === 'ghost-danger'
  const isIconOnly = !children

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'disabled:cursor-not-allowed disabled:opacity-55',
        isGhost && isIconOnly
          ? 'size-9 p-0'
          : cn(
              size === 'lg' && 'rounded-2xl px-5 py-3 text-base',
              size === 'md' && 'px-4 py-2.5 text-sm',
              size === 'sm' && 'rounded-lg px-2.5 py-1.5 text-xs',
              !children && size === 'sm' && 'px-2',
              !children && size === 'md' && 'px-2.5',
            ),
        isGhost
          ? cn(
              'ui-press transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
              'disabled:hover:translate-y-0 disabled:active:scale-100',
              variant === 'ghost-danger' && 'text-danger hover:bg-danger-soft hover:text-danger',
              variant === 'ghost' && !isIconOnly && 'text-muted hover:bg-ink/5 hover:text-ink',
              variant === 'ghost' && isIconOnly && 'border border-line text-muted hover:bg-paper hover:text-ink',
              variant === 'ghost-danger' && isIconOnly && 'border border-danger/40',
            )
          : cn(
              'btn-3d',
              size === 'lg' && 'btn-3d-lg',
              size === 'sm' && 'btn-3d-sm',
              variant === 'primary' && 'btn-3d-primary',
              variant === 'secondary' && 'btn-3d-secondary',
              variant === 'danger' && 'btn-3d-danger',
              variant === 'soft' && 'btn-3d-soft',
            ),
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner className={size === 'lg' ? 'size-5' : 'size-4'} />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
