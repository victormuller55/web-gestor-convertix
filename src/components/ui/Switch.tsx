import { cn } from '@/lib/cn'

export function Switch({
  checked,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  size?: 'md' | 'lg'
}) {
  const large = size === 'lg'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || (checked ? 'Desativar' : 'Ativar')}
      onClick={() => onChange(!checked)}
      className="ui-press flex items-center gap-3 text-sm font-medium text-ink"
    >
      <span
        className={cn(
          'relative rounded-full transition-colors duration-300 ease-out',
          large ? 'h-8 w-14' : 'h-7 w-12',
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
      {label}
    </button>
  )
}
