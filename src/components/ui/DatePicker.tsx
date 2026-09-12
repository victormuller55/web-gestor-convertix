import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { FloatLabel, hasFieldValue } from './FloatLabel'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

type DateMode = 'date' | 'month'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toIsoDay(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function toIsoMonth(year: number, month: number) {
  return `${year}-${pad(month)}`
}

function parseIsoDay(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function parseIsoMonth(value?: string) {
  if (!value) return null
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number)
    return { year, month }
  }
  const day = parseIsoDay(value)
  return day ? { year: day.year, month: day.month } : null
}

function formatMonthLabel(year: number, month: number) {
  const name = MONTHS[month - 1] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
}

function formatMonthValue(value: string) {
  const parsed = parseIsoMonth(value)
  if (!parsed) return ''
  return formatMonthLabel(parsed.year, parsed.month)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

function emitChange(
  onChange: InputHTMLAttributes<HTMLInputElement>['onChange'],
  value: string,
  name?: string,
) {
  onChange?.({
    target: { value, name: name ?? '' },
  } as React.ChangeEvent<HTMLInputElement>)
}

const controlClass =
  'w-full min-h-12 rounded-xl border border-line bg-card px-3 py-3 text-base text-ink outline-none transition-all duration-200 placeholder:text-muted/70 focus:border-brand disabled:bg-paper disabled:text-muted md:py-2.5 md:text-sm'

export function DatePicker({
  mode = 'date',
  label,
  error,
  hint,
  className,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  name,
  min,
  max,
  id,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  mode?: DateMode
  label?: string
  error?: string
  hint?: string
}) {
  const current = String(value ?? '')
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [nativeFocused, setNativeFocused] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const today = useMemo(() => new Date(), [open])
  const selectedMonth = parseIsoMonth(current)
  const [viewYear, setViewYear] = useState(selectedMonth?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selectedMonth?.month ?? today.getMonth() + 1)

  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const filled = hasFieldValue(current)
  const focused = open || nativeFocused
  const floated = Boolean(label) && (focused || filled)

  const display =
    mode === 'month' ? formatMonthValue(current) : current ? formatDate(current) : ''

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const parsed = parseIsoMonth(current)
    setViewYear(parsed?.year ?? today.getFullYear())
    setViewMonth(parsed?.month ?? today.getMonth() + 1)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(id)
  }, [open, current, today])

  useLayoutEffect(() => {
    if (!open) return

    function place() {
      const trigger = buttonRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const gap = 6
      const width = Math.max(rect.width, 288)
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const up = spaceBelow < 320 && spaceAbove > spaceBelow
      setOpenUp(up)
      setMenuStyle({
        position: 'fixed',
        left,
        width,
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
  }, [open, mode, viewYear, viewMonth])

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
    emitChange(onChange, next, name)
    setOpen(false)
  }

  function shiftMonth(delta: number) {
    const date = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(date.getFullYear())
    setViewMonth(date.getMonth() + 1)
  }

  function isDisabled(iso: string) {
    if (min && iso < String(min)) return true
    if (max && iso > String(max)) return true
    return false
  }

  const todayIso = toIsoDay(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const blanks = firstWeekday(viewYear, viewMonth)
  const totalDays = daysInMonth(viewYear, viewMonth)

  return (
    <div className={cn('block', className)}>
      <label className="relative block md:hidden">
        <input
          id={id}
          name={name}
          type={mode}
          value={current}
          min={min}
          max={max}
          disabled={disabled}
          {...rest}
          onChange={onChange}
          onFocus={(event) => {
            setNativeFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setNativeFocused(false)
            onBlur?.(event)
          }}
          className={cn(controlClass, error && 'border-danger focus:border-danger')}
        />
        {label && (
          <FloatLabel floated focused={nativeFocused} error={Boolean(error)}>
            {label}
          </FloatLabel>
        )}
      </label>

      <div ref={rootRef} className="relative hidden md:block">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={label}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            'flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 text-left text-sm outline-none transition-all duration-200',
            open ? 'border-brand' : 'border-line hover:border-ink/20 focus:border-brand',
            disabled && 'cursor-not-allowed bg-paper text-muted',
            error && 'border-danger',
          )}
        >
          <span className={cn('truncate', label && !filled && 'text-transparent')}>
            {display || '\u00a0'}
          </span>
          <Calendar
            className={cn('size-4 shrink-0 text-muted', open && 'text-brand')}
          />
        </button>

        {label && (
          <FloatLabel floated={floated} focused={open} error={Boolean(error)}>
            {label}
          </FloatLabel>
        )}

        {open &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="dialog"
              style={menuStyle}
              className={cn('select-menu p-3', visible && 'is-open', openUp && 'select-menu-up')}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
                  aria-label={mode === 'month' ? 'Ano anterior' : 'Mês anterior'}
                  onClick={() => (mode === 'month' ? setViewYear((y) => y - 1) : shiftMonth(-1))}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <p className="font-display text-sm font-semibold text-ink">
                  {mode === 'month' ? viewYear : formatMonthLabel(viewYear, viewMonth)}
                </p>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
                  aria-label={mode === 'month' ? 'Próximo ano' : 'Próximo mês'}
                  onClick={() => (mode === 'month' ? setViewYear((y) => y + 1) : shiftMonth(1))}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {mode === 'month' ? (
                <div className="grid grid-cols-3 gap-1">
                  {MONTHS_SHORT.map((labelMonth, index) => {
                    const month = index + 1
                    const iso = toIsoMonth(viewYear, month)
                    const active = selectedMonth?.year === viewYear && selectedMonth.month === month
                    const blocked = isDisabled(iso)
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={blocked}
                        onClick={() => pick(iso)}
                        className={cn(
                          'rounded-xl px-2 py-2.5 text-sm capitalize transition-colors',
                          active
                            ? 'bg-brand font-semibold text-brand-ink'
                            : 'text-ink hover:bg-paper',
                          blocked && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                        )}
                      >
                        {labelMonth}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <>
                  <div className="mb-1 grid grid-cols-7">
                    {WEEKDAYS.map((day, index) => (
                      <span
                        key={`${day}-${index}`}
                        className="grid h-8 place-items-center text-[11px] font-semibold text-muted"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: blanks }, (_, index) => (
                      <span key={`blank-${index}`} />
                    ))}
                    {Array.from({ length: totalDays }, (_, index) => {
                      const day = index + 1
                      const iso = toIsoDay(viewYear, viewMonth, day)
                      const active = current === iso
                      const isToday = iso === todayIso
                      const blocked = isDisabled(iso)
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={blocked}
                          onClick={() => pick(iso)}
                          className={cn(
                            'mx-auto grid size-9 place-items-center rounded-lg text-sm transition-colors',
                            active && 'bg-brand font-semibold text-brand-ink',
                            !active && isToday && 'font-semibold text-brand ring-1 ring-brand/40',
                            !active && !isToday && 'text-ink hover:bg-paper',
                            blocked && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                          )}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-xl px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
                    onClick={() => pick(todayIso)}
                    disabled={isDisabled(todayIso)}
                  >
                    Hoje
                  </button>
                </>
              )}
            </div>,
            document.body,
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
