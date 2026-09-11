import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { fotoUrl } from '@/lib/links'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const url = fotoUrl(src)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [url])

  const iconSize = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-6' : 'size-4'
  const showImage = Boolean(url && !failed)
  const showBroken = Boolean(url && failed && !name)

  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-forest font-semibold text-white',
        size === 'sm' && 'size-8 text-[10px]',
        size === 'md' && 'size-10 text-xs',
        size === 'lg' && 'size-14 text-sm',
        className,
      )}
    >
      {showImage ? (
        <img
          src={url}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : showBroken ? (
        <ImageOff className={cn(iconSize, 'text-white/70')} aria-hidden />
      ) : (
        initials(name)
      )}
    </div>
  )
}
