import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'warn' | 'danger' | 'info' | 'brand'

const tones: Record<Tone, string> = {
  neutral: 'bg-paper text-muted ring-line',
  success: 'bg-brand-soft text-brand-ink ring-brand/20',
  warn: 'bg-warn-soft text-warn ring-warn/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
  brand: 'bg-forest text-white ring-forest/30',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: string
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1',
        'transition-transform duration-200 ease-out',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
