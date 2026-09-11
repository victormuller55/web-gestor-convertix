import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { maskCurrency } from '@/lib/format'

interface FieldProps {
  label?: string
  error?: string
  hint?: string
  className?: string
}

export function Field({
  label,
  error,
  hint,
  className,
  children,
}: FieldProps & { children: ReactNode }) {
  return (
    <label className={cn('block space-y-1', className)}>
      {label && <span className="text-sm font-medium text-ink md:text-xs">{label}</span>}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

const controlClass =
  'w-full min-h-11 rounded-xl border border-line bg-card px-3 py-3 text-base text-ink outline-none transition-all duration-200 placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-paper disabled:text-muted md:min-h-0 md:py-2 md:text-sm'

export function Input({
  label,
  error,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <input className={controlClass} {...props} />
    </Field>
  )
}

export function CurrencyInput({
  onChange,
  placeholder = 'R$ 0,00',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> & FieldProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      onChange={(e) => {
        e.target.value = maskCurrency(e.target.value)
        onChange?.(e)
      }}
    />
  )
}

export function Textarea({
  label,
  error,
  hint,
  className,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <textarea className={cn(controlClass, 'resize-y')} rows={rows} {...props} />
    </Field>
  )
}

export { Select, SearchInput } from './Select'
