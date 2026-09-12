import { cn } from '@/lib/cn'

export function Switch({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  className,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  size?: 'md' | 'lg'
  className?: string
}) {
  const large = size === 'lg'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || (checked ? 'Desativar' : 'Ativar')}
      onClick={() => onChange(!checked)}
      className={cn(
        'ui-press flex items-center gap-3 text-left text-sm font-medium text-ink',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        description && 'items-start',
        className,
      )}
    >
      <span
        className={cn(
          'relative shrink-0 rounded-full transition-colors duration-300 ease-out',
          large ? 'h-8 w-14' : 'h-7 w-12',
          description && 'mt-0.5',
          checked ? 'bg-brand' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            large ? 'size-7' : 'size-6',
            checked && (large ? 'translate-x-6' : 'translate-x-5'),
          )}
        />
      </span>
      {label ? (
        <span className="min-w-0">
          <span className="block">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted">{description}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  )
}
