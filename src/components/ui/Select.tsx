import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FloatLabel, hasFieldValue } from './FloatLabel'

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
  const [nativeFocused, setNativeFocused] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = String(value ?? '')
  const selected = options.find((o) => o.value === current) ?? options[0]
  const filled = hasFieldValue(current)
  const floated = Boolean(label) && (open || filled || nativeFocused)

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

  useLayoutEffect(() => {
    if (!open) return

    function place() {
      const trigger = buttonRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const gap = 6
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const up = spaceBelow < 168 && spaceAbove > spaceBelow
      const maxHeight = Math.max(120, Math.min(280, up ? spaceAbove : spaceBelow))
      setOpenUp(up)
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        maxHeight,
        zIndex: 90,
        ...(up
          ? { top: 'auto', bottom: window.innerHeight - rect.top + gap }
          : { top: rect.bottom + gap, bottom: 'auto' }),
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      event.preventDefault()
      setOpen(false)
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
    <div className={cn('block', className)}>
      <div className="relative">
        <select
          {...props}
          value={current}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setNativeFocused(true)}
          onBlur={() => setNativeFocused(false)}
          className={cn(
            'min-h-12 w-full rounded-xl border border-line bg-card px-3 py-3 text-base text-ink outline-none transition-all duration-200',
            'focus:border-brand disabled:bg-paper disabled:text-muted md:hidden',
            error && 'border-danger focus:border-danger',
            label && !filled && 'text-transparent',
          )}
        >
          {children}
        </select>

        <div ref={rootRef} className="relative hidden md:block">
          <button
            ref={buttonRef}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={label}
            onClick={() => !disabled && setOpen((v) => !v)}
            className={cn(
              'flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 text-left text-sm outline-none transition-all duration-200',
              open
                ? 'border-brand'
                : 'border-line hover:border-ink/20 focus:border-brand',
              disabled && 'cursor-not-allowed bg-paper text-muted',
              error && 'border-danger',
            )}
          >
            <span className={cn('truncate', label && !filled && 'text-transparent')}>
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

          {open &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={menuRef}
                id={listId}
                role="listbox"
                style={menuStyle}
                className={cn('select-menu', visible && 'is-open', openUp && 'select-menu-up')}
              >
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
              </div>,
              document.body,
            )}
        </div>

        {label && (
          <FloatLabel floated={floated} focused={open || nativeFocused} error={Boolean(error)}>
            {label}
          </FloatLabel>
        )}
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  label = 'Buscar',
  placeholder = 'Buscar…',
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  const mirrorRef = useRef<HTMLSpanElement>(null)
  const [focused, setFocused] = useState(false)
  const [caretLeft, setCaretLeft] = useState(40)
  const [typingDir, setTypingDir] = useState<'right' | 'left' | null>(null)
  const prevLen = useRef(value.length)
  const floated = focused || value.length > 0

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
    <label className={cn('search-field group relative block', className)}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 transition-colors duration-200',
          focused ? 'text-brand' : 'text-muted',
        )}
      />
      <input
        {...props}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          'search-input min-h-12 w-full rounded-xl border bg-card py-3 pr-3 pl-10 text-base text-ink outline-none transition-all duration-200 md:py-2.5 md:text-sm',
          focused
            ? 'border-brand'
            : 'border-line hover:border-ink/20',
        )}
      />
      <FloatLabel floated={floated} focused={focused} search>
        {floated ? label : placeholder}
      </FloatLabel>
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
    </label>
  )
}
