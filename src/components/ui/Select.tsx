import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'

type Option = { value: string; label: string }

function optionsFromChildren(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return []
    const el = child as ReactElement<{ value?: string | number; children?: ReactNode }>
    if (el.type !== 'option') return []
    return [
      {
        value: String(el.props.value ?? ''),
        label: String(el.props.children ?? ''),
      },
    ]
  })
}

function FieldWrap({
  label,
  error,
  hint,
  className,
  children,
}: {
  label?: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('block space-y-1', className)}>
      {label && <span className="text-sm font-medium text-ink md:text-xs">{label}</span>}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  )
}

export function Select({
  label,
  error,
  hint,
  className,
  children,
  value,
  disabled,
  onChange,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  const options = useMemo(() => optionsFromChildren(children), [children])
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = String(value ?? '')
  const selected = options.find((o) => o.value === current) ?? options[0]

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(next: string) {
    onChange?.({
      target: { value: next },
    } as React.ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <FieldWrap label={label} error={error} hint={hint} className={className}>
      <select
        {...props}
        value={current}
        disabled={disabled}
        onChange={onChange}
        className={cn(
          'min-h-11 w-full rounded-xl border border-line bg-card px-3 py-3 text-base text-ink outline-none transition-all duration-200',
          'focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-paper disabled:text-muted md:hidden',
        )}
      >
        {children}
      </select>

      <div ref={rootRef} className="relative hidden md:block">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 text-left text-sm outline-none transition-all duration-200',
            open
              ? 'border-brand ring-4 ring-brand/15'
              : 'border-line hover:border-ink/20 focus:border-brand focus:ring-4 focus:ring-brand/15',
            disabled && 'cursor-not-allowed bg-paper text-muted',
          )}
        >
          <span className={cn('truncate', !selected?.label && 'text-muted')}>
            {selected?.label || 'Selecione'}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted transition-transform duration-300',
              open && 'rotate-180 text-brand',
            )}
          />
        </button>

        <select
          {...props}
          value={current}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        >
          {children}
        </select>

        {open && (
          <div id={listId} role="listbox" className={cn('select-menu', visible && 'is-open')}>
            {options.map((option) => {
              const active = option.value === current
              return (
                <button
                  key={option.value || '__empty'}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(option.value)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors duration-150',
                    active
                      ? 'bg-brand-soft font-semibold text-brand-ink'
                      : 'text-ink hover:bg-paper',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check className="size-4 shrink-0 text-brand" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </FieldWrap>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string
  onChange: (value: string) => void
}) {
  const mirrorRef = useRef<HTMLSpanElement>(null)
  const [focused, setFocused] = useState(false)
  const [caretLeft, setCaretLeft] = useState(40)
  const [typingDir, setTypingDir] = useState<'right' | 'left' | null>(null)
  const prevLen = useRef(value.length)

  useEffect(() => {
    const nextLen = value.length
    if (nextLen > prevLen.current) setTypingDir('right')
    else if (nextLen < prevLen.current) setTypingDir('left')
    prevLen.current = nextLen

    const mirror = mirrorRef.current
    if (mirror) setCaretLeft(40 + mirror.offsetWidth)

    const timer = window.setTimeout(() => setTypingDir(null), 220)
    return () => window.clearTimeout(timer)
  }, [value])

  return (
    <div className={cn('search-field group relative', className)}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors duration-200',
          focused ? 'text-brand' : 'text-muted',
        )}
      />
      <input
        {...props}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          'search-input w-full rounded-xl border bg-card py-3 pr-3 pl-10 text-base text-ink outline-none transition-all duration-200 md:py-2.5 md:text-sm',
          'placeholder:text-muted/70',
          focused
            ? 'border-brand ring-4 ring-brand/15'
            : 'border-line hover:border-ink/20',
        )}
      />
      <span
        ref={mirrorRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-10 -z-10 whitespace-pre text-sm opacity-0"
      >
        {value}
      </span>
      {(focused || value.length > 0) && (
        <span
          className={cn(
            'search-caret',
            typingDir === 'right' && 'is-typing-right',
            typingDir === 'left' && 'is-typing-left',
          )}
          style={{ left: caretLeft }}
        />
      )}
    </div>
  )
}
