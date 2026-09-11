import { useEffect, useMemo, useState } from 'react'
import { Camera, ImageOff } from 'lucide-react'
import { fotoUrl } from '@/lib/links'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

export function PhotoPicker({
  name,
  currentUrl,
  file,
  onChange,
  layout = 'row',
  size = 'md',
}: {
  name?: string
  currentUrl?: string | null
  file?: File | null
  onChange: (file: File | null) => void
  layout?: 'row' | 'stack'
  size?: 'md' | 'lg'
}) {
  const [failed, setFailed] = useState(false)

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    return fotoUrl(currentUrl)
  }, [file, currentUrl])

  useEffect(() => {
    setFailed(false)
  }, [preview])

  return (
    <label
      className={cn(
        'flex cursor-pointer',
        layout === 'stack' ? 'flex-col items-center gap-3 text-center' : 'items-center gap-4',
      )}
    >
      <div
        className={cn(
          'relative grid place-items-center overflow-hidden rounded-2xl bg-forest font-semibold text-white',
          size === 'lg' ? 'size-28 text-2xl' : 'size-20 text-lg',
        )}
      >
        {preview && !failed ? (
          <img
            src={preview}
            alt=""
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : preview && failed ? (
          <ImageOff className="size-7 text-white/70" aria-hidden />
        ) : (
          initials(name)
        )}
        <span className="absolute right-1 bottom-1 grid size-7 place-items-center rounded-lg bg-brand text-brand-ink">
          <Camera className="size-3.5" />
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">
          {layout === 'stack' ? 'Alterar foto' : 'Foto de perfil'}
        </p>
        <p className="text-xs text-muted">JPEG, PNG ou WebP até 5 MB</p>
        {file && <p className="mt-1 text-xs text-brand">Nova foto selecionada</p>}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  )
}
