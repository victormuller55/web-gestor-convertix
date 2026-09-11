import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

export function Pagination({
  page,
  totalPages,
  totalElements,
  onPage,
}: {
  page: number
  totalPages: number
  totalElements: number
  onPage: (page: number) => void
}) {
  const safeTotal = Math.max(totalPages, 1)
  return (
    <div className="flex flex-col gap-3 border-t border-line bg-card px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-muted max-md:rounded-2xl max-md:border max-md:border-line md:flex-row md:flex-wrap md:items-center md:justify-between md:pb-4">
      <span className="max-md:text-center">
        {totalElements} registro{totalElements === 1 ? '' : 's'} · página {page + 1} de {safeTotal}
      </span>
      <div className="grid grid-cols-2 gap-2 md:flex">
        <Button variant="secondary" size="sm" className="max-md:w-full" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="max-md:w-full"
          disabled={page + 1 >= safeTotal}
          onClick={() => onPage(page + 1)}
        >
          Próxima
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
