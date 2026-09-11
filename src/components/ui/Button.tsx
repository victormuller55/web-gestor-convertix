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
        'ui-press relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-55',
        isGhost && isIconOnly
          ? 'size-11 p-0 md:size-9'
          : cn(
              size === 'lg' && 'rounded-2xl px-5 py-3 text-base',
              size === 'md' && 'px-4 py-2.5 text-sm',
              size === 'sm' && 'rounded-lg px-2.5 py-1.5 text-xs',
              !children && size === 'sm' && 'px-2',
              !children && size === 'md' && 'px-2.5',
            ),
        variant === 'primary' && 'bg-brand text-white hover:bg-brand-hover',
        variant === 'secondary' && 'border border-line bg-card text-ink hover:bg-paper',
        variant === 'danger' && 'bg-danger text-white hover:bg-danger/90',
        variant === 'soft' && 'bg-brand-soft text-brand-ink hover:bg-brand/15',
        variant === 'ghost' && !isIconOnly && 'text-muted hover:bg-ink/5 hover:text-ink',
        variant === 'ghost' && isIconOnly && 'border border-line text-muted hover:bg-paper hover:text-ink',
        variant === 'ghost-danger' && 'text-danger hover:bg-danger-soft hover:text-danger',
        variant === 'ghost-danger' && isIconOnly && 'border border-danger/40',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className={size === 'lg' ? 'size-5' : 'size-4'} /> : icon}
      {children}
    </button>
  )
}
