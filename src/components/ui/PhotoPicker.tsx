import { useEffect, useMemo, useState } from 'react'
import { Camera, ImageOff, Trash2 } from 'lucide-react'
import { fotoUrl } from '@/lib/links'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

export function PhotoPicker({
  name,
  currentUrl,
  file,
  onChange,
  onRemove,
  layout = 'row',
  size = 'md',
}: {
  name?: string
  currentUrl?: string | null
  file?: File | null
  onChange: (file: File | null) => void
  onRemove?: () => void
  layout?: 'row' | 'stack'
  size?: 'md' | 'lg' | 'xl'
}) {
  const [failed, setFailed] = useState(false)

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    return fotoUrl(currentUrl)
  }, [file, currentUrl])

  useEffect(() => {
    setFailed(false)
  }, [preview])

  const showingPhoto = Boolean(preview) && !failed
  const canRemove = Boolean(onRemove) && (Boolean(file) || Boolean(currentUrl))

  return (
    <div
      className={cn(
        'flex',
        layout === 'stack' ? 'flex-col items-center gap-3 text-center' : 'items-center gap-4',
      )}
    >
      <div className="relative">
        <label className="block cursor-pointer">
          <div
            className={cn(
              'relative grid place-items-center overflow-hidden rounded-2xl bg-forest font-semibold text-white',
              size === 'xl' && 'size-40 text-4xl sm:size-44 md:size-48',
              size === 'lg' && 'size-28 text-2xl',
              size === 'md' && 'size-20 text-lg',
            )}
          >
            {showingPhoto ? (
              <img
                src={preview}
                alt=""
                className="size-full object-cover"
                onError={() => setFailed(true)}
              />
            ) : preview && failed ? (
              <ImageOff className={cn('text-white/70', size === 'xl' ? 'size-10' : 'size-7')} aria-hidden />
            ) : (
              initials(name)
            )}
            <span className="absolute right-1.5 bottom-1.5 grid size-8 place-items-center rounded-lg bg-brand text-brand-ink">
              <Camera className="size-4" />
            </span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          />
        </label>
        {canRemove ? (
          <button
            type="button"
            title="Excluir foto"
            aria-label="Excluir foto"
            className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-lg bg-card/90 text-danger shadow-sm ring-1 ring-line transition-colors hover:bg-danger hover:text-white"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove?.()
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div>
        {layout === 'stack' ? (
          <p className="text-xs text-muted">JPEG, PNG ou WebP até 5 MB</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink">Foto de perfil</p>
            <p className="text-xs text-muted">JPEG, PNG ou WebP até 5 MB</p>
          </>
        )}
        {file ? <p className="mt-1 text-xs text-brand">Nova foto selecionada</p> : null}
      </div>
    </div>
  )
}
