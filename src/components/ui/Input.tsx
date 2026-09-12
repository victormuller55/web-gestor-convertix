import { useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import { maskCurrency } from '@/lib/format'
import { DatePicker } from './DatePicker'
import { FloatLabel, hasFieldValue, isAlwaysFloatedType } from './FloatLabel'

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
  'w-full min-h-12 rounded-xl border border-line bg-card px-3 py-3 text-base text-ink outline-none transition-all duration-200 placeholder:text-muted/70 focus:border-brand disabled:bg-paper disabled:text-muted md:py-2.5 md:text-sm'

function FieldMessage({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <span className="mt-1 block text-xs text-danger">{error}</span>
  if (hint) return <span className="mt-1 block text-xs text-muted">{hint}</span>
  return null
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      className="absolute top-1/2 right-1.5 z-[1] grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
    >
      {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
}

export function Input({
  label,
  error,
  hint,
  className,
  onFocus,
  onBlur,
  placeholder,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  if (type === 'date' || type === 'month') {
    return (
      <DatePicker
        {...props}
        mode={type === 'month' ? 'month' : 'date'}
        label={label}
        error={error}
        hint={hint}
        className={className}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    )
  }

  return (
    <TextInput
      {...props}
      label={label}
      error={error}
      hint={hint}
      className={className}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      type={type}
    />
  )
}

function TextInput({
  label,
  error,
  hint,
  className,
  onFocus,
  onBlur,
  placeholder,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const filled = hasFieldValue(props.value ?? props.defaultValue)
  const floated = Boolean(label) && (focused || filled || isAlwaysFloatedType(type))

  const input = (
    <input
      {...props}
      type={isPassword ? (showPassword ? 'text' : 'password') : type}
      placeholder={label ? (floated ? placeholder : undefined) : placeholder}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        onBlur?.(event)
      }}
      className={cn(
        controlClass,
        isPassword && 'pr-11',
        error && 'border-danger focus:border-danger',
      )}
    />
  )

  if (!label && !isPassword) {
    return (
      <Field error={error} hint={hint} className={className}>
        {input}
      </Field>
    )
  }

  return (
    <label className={cn('block', className)}>
      <span className="relative block">
        {input}
        {label && (
          <FloatLabel floated={floated} focused={focused} error={Boolean(error)}>
            {label}
          </FloatLabel>
        )}
        {isPassword && (
          <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        )}
      </span>
      <FieldMessage error={error} hint={hint} />
    </label>
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
  onFocus,
  onBlur,
  placeholder,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const [focused, setFocused] = useState(false)
  const filled = hasFieldValue(props.value ?? props.defaultValue)
  const floated = Boolean(label) && (focused || filled)

  if (!label) {
    return (
      <Field error={error} hint={hint} className={className}>
        <textarea
          {...props}
          rows={rows}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(controlClass, 'resize-y', error && 'border-danger focus:border-danger')}
        />
      </Field>
    )
  }

  return (
    <label className={cn('block', className)}>
      <span className="relative block">
        <textarea
          {...props}
          rows={rows}
          placeholder={floated ? placeholder : undefined}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          className={cn(controlClass, 'resize-y', error && 'border-danger focus:border-danger')}
        />
        <FloatLabel floated={floated} focused={focused} error={Boolean(error)} textarea>
          {label}
        </FloatLabel>
      </span>
      <FieldMessage error={error} hint={hint} />
    </label>
  )
}

export { Select, SearchInput } from './Select'
