import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  empty?: ReactNode
}) {
  if (!rows.length) {
    return empty ?? null
  }

  const photoCol = columns.find((col) => col.key === 'foto')
  const titleCol = columns.find((col) => col.key !== 'acoes' && col.key !== 'foto')
  const actionCol = columns.find((col) => col.key === 'acoes')
  const detailCols = columns.filter(
    (col) => col.key !== 'acoes' && col.key !== 'foto' && col !== titleCol,
  )

  return (
    <>
      <div className="md:hidden">
        {rows.map((row) => (
          <article
            key={rowKey(row)}
            className="border-b border-line bg-card p-4"
          >
            {titleCol && (
              <div className="flex min-w-0 items-center gap-3 leading-snug">
                {photoCol ? <div className="shrink-0">{photoCol.render(row)}</div> : null}
                <div className="min-w-0">{titleCol.render(row)}</div>
              </div>
            )}
            {detailCols.length > 0 && (
              <dl className="mt-3 space-y-2.5">
                {detailCols.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 pt-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                      {col.header}
                    </dt>
                    <dd className="min-w-0 text-right text-sm text-ink">{col.render(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actionCol && (
              <div className="mt-3 flex justify-end border-t border-line pt-3">{actionCol.render(row)}</div>
            )}
          </article>
        ))}
      </div>

      <div className="hidden md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-line bg-card text-xs tracking-wide text-muted uppercase shadow-[0_1px_0_0_var(--color-line)]">
              {columns.map((col, index) => (
                <th
                  key={col.key}
                  className={cn(
                    'bg-card py-3 font-semibold',
                    col.key === 'acoes'
                      ? 'w-[1%] whitespace-nowrap pl-8 pr-4'
                      : columns[index + 1]?.key === 'acoes'
                        ? 'w-[1%] whitespace-nowrap pl-4 pr-4'
                        : 'px-4',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-line/70 transition-colors duration-200 last:border-0 hover:bg-paper"
              >
                {columns.map((col, index) => (
                  <td
                    key={col.key}
                    className={cn(
                      'align-middle py-3.5',
                      col.key === 'acoes'
                        ? 'w-[1%] whitespace-nowrap pl-8 pr-4'
                        : columns[index + 1]?.key === 'acoes'
                          ? 'w-[1%] whitespace-nowrap pl-4 pr-4'
                          : 'px-4',
                      col.className,
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
