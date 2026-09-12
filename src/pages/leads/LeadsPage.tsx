import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import {
  alterarStatusLead,
  apagarLead,
  listarLandingPages,
  listarLeads,
} from '@/lib/api/landingPages'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDateTime } from '@/lib/format'
import { STATUS_LANDING_PAGE_LEAD_LABEL } from '@/lib/labels'
import { StatusLandingPageLead } from '@/types/enums'
import type { LandingPageLead } from '@/types/models'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/Select'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'
import { StatusLandingPageLeadBadge } from '@/components/status/badges'

export function LeadsPage() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const landingPageId = params.get('landing_page_id') || ''
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const search = useDebouncedValue(query)
  const [detalhe, setDetalhe] = useState<LandingPageLead | null>(null)
  const [statusEdit, setStatusEdit] = useState<StatusLandingPageLead>(StatusLandingPageLead.NOVO)
  const [observacao, setObservacao] = useState('')
  const [removing, setRemoving] = useState<LandingPageLead | null>(null)

  const list = useQuery({
    queryKey: ['landing-page-leads', landingPageId, status, search, page],
    queryFn: () =>
      listarLeads({
        landing_page_id: landingPageId ? Number(landingPageId) : undefined,
        status: (status || undefined) as StatusLandingPageLead | undefined,
        query: search,
        page,
        size: 20,
      }),
  })
  const paginas = useQuery({
    queryKey: ['landing-pages-lookup-leads'],
    queryFn: () => listarLandingPages({ page: 0, size: 100 }),
  })

  const saveStatus = useMutation({
    mutationFn: () =>
      alterarStatusLead(detalhe!.landing_page_id, detalhe!.id, {
        status: statusEdit,
        observacao: observacao.trim() || undefined,
      }),
    onSuccess: (row) => {
      push('Lead atualizado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-page-leads'] })
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      setDetalhe(row)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao atualizar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (lead: LandingPageLead) => apagarLead(lead.landing_page_id, lead.id),
    onSuccess: () => {
      push('Lead excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-page-leads'] })
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      setRemoving(null)
      setDetalhe(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  const columns = useMemo<Column<LandingPageLead>[]>(
    () => [
      {
        key: 'lead',
        header: 'Lead',
        render: (row) => (
          <div>
            <p className="font-semibold">{row.nome || row.email || 'Sem nome'}</p>
            <p className="text-xs text-muted">{row.email || row.telefone || '—'}</p>
          </div>
        ),
      },
      {
        key: 'pagina',
        header: 'Página',
        render: (row) => row.site_nome || row.landing_page_slug || '—',
      },
      {
        key: 'form',
        header: 'Formulário',
        render: (row) => row.formulario_nome || '—',
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusLandingPageLeadBadge status={row.status} />,
      },
      {
        key: 'quando',
        header: 'Recebido',
        render: (row) => formatDateTime(row.created_at),
      },
      {
        key: 'acoes',
        header: '',
        className: 'text-right',
        render: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              title="Detalhe"
              aria-label="Detalhe"
              icon={<Eye className="size-5" />}
              onClick={() => {
                setDetalhe(row)
                setStatusEdit(row.status)
                setObservacao(row.observacao ?? '')
              }}
            />
            {isAdmin ? (
              <Button
                variant="ghost-danger"
                size="sm"
                title="Excluir"
                aria-label="Excluir"
                icon={<Trash2 className="size-5" />}
                onClick={() => setRemoving(row)}
              />
            ) : null}
          </div>
        ),
      },
    ],
    [isAdmin],
  )

  const respostas = Object.entries(detalhe?.respostas ?? {})

  return (
    <PageFill>
      <PageHeader
        eyebrow="Operação"
        title="Leads"
        description="Contatos capturados nos formulários das landing pages."
      />

      <DataTableShell
        toolbar={
          <div className="grid gap-2 md:grid-cols-3">
            <SearchInput
              placeholder="Buscar por nome, e-mail ou telefone"
              value={query}
              onChange={(next) => {
                setQuery(next)
                setPage(0)
              }}
            />
            <Select
              label="Landing page"
              value={landingPageId}
              onChange={(e) => {
                const next = new URLSearchParams(params)
                if (e.target.value) next.set('landing_page_id', e.target.value)
                else next.delete('landing_page_id')
                setParams(next, { replace: true })
                setPage(0)
              }}
            >
              <option value="">Todas</option>
              {(paginas.data?.content ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.site_nome || item.slug}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LANDING_PAGE_LEAD_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        }
        footer={
          <Pagination
            page={list.data?.page ?? page}
            totalPages={list.data?.total_pages ?? 1}
            totalElements={list.data?.total_elements ?? 0}
            onPage={setPage}
          />
        }
      >
        {list.isLoading ? (
          <PageSpinner />
        ) : (
          <Table
            columns={columns}
            rows={list.data?.content ?? []}
            rowKey={(row) => row.id}
            empty={<EmptyState title="Nenhum lead encontrado" />}
          />
        )}
      </DataTableShell>

      <Modal
        open={Boolean(detalhe)}
        title={detalhe?.nome || detalhe?.email || 'Lead'}
        description={detalhe?.site_nome || detalhe?.landing_page_slug || undefined}
        onClose={() => setDetalhe(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDetalhe(null)}>
              Fechar
            </Button>
            <Button loading={saveStatus.isPending} onClick={() => saveStatus.mutate()}>
              Salvar status
            </Button>
          </div>
        }
      >
        {detalhe ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-sm">
                <span className="text-muted">E-mail</span>
                <br />
                {detalhe.email || '—'}
              </p>
              <p className="text-sm">
                <span className="text-muted">Telefone</span>
                <br />
                {detalhe.telefone || '—'}
              </p>
              <p className="text-sm">
                <span className="text-muted">Formulário</span>
                <br />
                {detalhe.formulario_nome || '—'}
              </p>
              <p className="text-sm">
                <span className="text-muted">Recebido</span>
                <br />
                {formatDateTime(detalhe.created_at)}
              </p>
            </div>
            {respostas.length > 0 ? (
              <div className="rounded-2xl border border-line bg-paper/50 p-4">
                <p className="mb-2 text-sm font-medium">Respostas</p>
                <dl className="space-y-2">
                  {respostas.map(([chave, valor]) => (
                    <div key={chave}>
                      <dt className="text-xs text-muted">{chave}</dt>
                      <dd className="text-sm">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            <Select
              label="Status"
              value={statusEdit}
              onChange={(e) => setStatusEdit(e.target.value as StatusLandingPageLead)}
            >
              {Object.entries(STATUS_LANDING_PAGE_LEAD_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Textarea
              label="Observação"
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir lead"
        message={`Deseja excluir ${removing?.nome || removing?.email || 'este lead'}?`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing)}
      />
    </PageFill>
  )
}
