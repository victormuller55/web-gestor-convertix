import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[12rem] items-center justify-center text-muted">
      <Spinner className="size-6" />
    </div>
  )
}
