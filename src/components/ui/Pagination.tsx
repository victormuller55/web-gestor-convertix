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
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 pb-4 text-sm text-muted">
      <span>
        {totalElements} registro{totalElements === 1 ? '' : 's'} · página {page + 1} de {safeTotal}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
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
