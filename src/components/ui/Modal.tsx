import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  wide,
  footer,
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
  footer?: ReactNode
}) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true))
      })
      return () => window.cancelAnimationFrame(id)
    }

    setVisible(false)
    const timer = window.setTimeout(() => setMounted(false), 280)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, onClose])

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto p-0 md:items-center md:p-4">
      <button
        type="button"
        className={cn('modal-backdrop absolute inset-0', visible && 'is-open')}
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className={cn(
          'modal-panel relative z-10 w-full overflow-hidden border border-line bg-card shadow-2xl',
          'max-md:my-0 max-md:max-h-[94dvh] max-md:rounded-t-3xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0',
          'md:my-6 md:rounded-3xl',
          wide ? 'max-w-4xl' : 'max-w-xl',
          visible && 'is-open',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <h2 id="modal-title" className="font-display text-xl text-ink md:text-2xl">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-press min-h-11 min-w-11 rounded-xl p-2 text-muted transition-colors hover:bg-paper hover:text-ink md:min-h-0 md:min-w-0"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[min(70vh,calc(94dvh-11rem))] overflow-y-auto px-4 py-4 scrollbar-thin md:max-h-[70vh] md:px-6 md:py-5">
          {children}
        </div>
        {footer && (
          <div className="modal-footer border-t border-line bg-paper/70 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
