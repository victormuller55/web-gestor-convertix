import { useRef } from 'react'
import { Download, FileText, Trash2, Upload } from 'lucide-react'
import { formatBytes } from '@/lib/format'
import { fotoUrl } from '@/lib/links'
import { isPdfFile, PDF_MAX_BYTES } from '@/lib/validators'
import { Button } from './Button'
import { cn } from '@/lib/cn'

export function PdfPicker({
  currentUrl,
  file,
  onChange,
  onRemoveCurrent,
  error,
  disabled,
  readOnly,
  onInvalid,
}: {
  currentUrl?: string | null
  file?: File | null
  onChange?: (file: File | null) => void
  onRemoveCurrent?: () => void
  error?: string
  disabled?: boolean
  readOnly?: boolean
  onInvalid?: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const existingUrl = currentUrl ? fotoUrl(currentUrl) : ''
  const locked = disabled || readOnly

  function selectFile(next?: File | null) {
    if (readOnly) return
    if (!next) {
      onChange?.(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (!isPdfFile(next)) {
      onInvalid?.('Selecione somente arquivos PDF.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (next.size > PDF_MAX_BYTES) {
      onInvalid?.('O PDF deve ter no máximo 5 MB.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    onChange?.(next)
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'rounded-2xl border border-line bg-paper px-4 py-3',
          error && 'border-danger',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-brand">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Documento de requisitos</p>
              {file ? (
                <p className="truncate text-xs text-muted">
                  {file.name} · {formatBytes(file.size)}
                </p>
              ) : existingUrl ? (
                <p className="text-xs text-muted">PDF cadastrado</p>
              ) : (
                <p className="text-xs text-muted">{readOnly ? 'Nenhum PDF cadastrado' : 'PDF até 5 MB'}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {existingUrl && !file && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FileText className="size-3.5" />}
                  onClick={() => window.open(existingUrl, '_blank', 'noopener,noreferrer')}
                >
                  Visualizar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download className="size-3.5" />}
                  onClick={() => window.open(existingUrl, '_blank', 'noopener,noreferrer')}
                >
                  Download
                </Button>
              </>
            )}
            {!readOnly && (
              <Button
                variant="secondary"
                size="sm"
                disabled={locked}
                icon={<Upload className="size-3.5" />}
                onClick={() => inputRef.current?.click()}
              >
                {existingUrl || file ? 'Substituir' : 'Selecionar PDF'}
              </Button>
            )}
            {!readOnly && (file || existingUrl) && (
              <Button
                variant="ghost-danger"
                size="sm"
                disabled={locked}
                icon={<Trash2 className="size-3.5" />}
                onClick={() => {
                  selectFile(null)
                  if (!file) onRemoveCurrent?.()
                }}
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={locked}
        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
      />
    </div>
  )
}
