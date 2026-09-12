import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Columns3, Eye, List, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  alterarEtapaProjeto,
  alterarProjeto,
  apagarProjeto,
  criarProjeto,
  listarProjetos,
  type ProjetoPayload,
} from '@/lib/api/projetos'
import { listarClientes } from '@/lib/api/clientes'
import { listarSites } from '@/lib/api/sites'
import { listarAplicativosMobile } from '@/lib/api/aplicativosMobile'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDate, formatDateTime } from '@/lib/format'
import { ETAPA_PROJETO_LABEL, TIPO_PROJETO_LABEL } from '@/lib/labels'
import { ETAPAS_PROJETO, EtapaProjeto, TipoProjeto } from '@/types/enums'
import type { Projeto } from '@/types/models'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/Select'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'
import { EtapaProjetoBadge, TipoProjetoBadge } from '@/components/status/badges'
import { cn } from '@/lib/cn'

interface FormState {
  cliente_id: string
  titulo: string
  tipo: TipoProjeto
  etapa: EtapaProjeto
  vinculo: string
  prazo: string
  descricao: string
  observacao_interna: string
}

const emptyForm: FormState = {
  cliente_id: '',
  titulo: '',
  tipo: TipoProjeto.APLICATIVO_MOBILE,
  etapa: EtapaProjeto.BRIEFING,
  vinculo: '',
  prazo: '',
  descricao: '',
  observacao_interna: '',
}

function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function isAtrasado(projeto: Projeto) {
  if (!projeto.prazo) return false
  if (projeto.etapa === EtapaProjeto.CONCLUIDO || projeto.etapa === EtapaProjeto.CANCELADO) {
    return false
  }
  return projeto.prazo < todayIso()
}

function vinculoDe(projeto: Projeto) {
  if (projeto.site_id) return `site:${projeto.site_id}`
  if (projeto.aplicativo_mobile_id) return `app:${projeto.aplicativo_mobile_id}`
  return ''
}

function vinculoLabel(projeto: Projeto) {
  return projeto.aplicativo_mobile_nome || projeto.site_nome || '—'
}

function parseVinculo(value: string) {
  if (value.startsWith('site:')) return { site_id: Number(value.slice(5)), aplicativo_mobile_id: undefined }
  if (value.startsWith('app:')) return { site_id: undefined, aplicativo_mobile_id: Number(value.slice(4)) }
  return { site_id: undefined, aplicativo_mobile_id: undefined }
}

export function ProjetosPage() {
  const { isAdmin, user } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [filtroEtapa, setFiltroEtapa] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Projeto | null>(null)
  const [viewing, setViewing] = useState<Projeto | null>(null)
  const [removing, setRemoving] = useState<Projeto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const dragged = useRef(false)
  const search = useDebouncedValue(query)

  const list = useQuery({
    queryKey: [
      'projetos',
      user?.id,
      view,
      search,
      page,
      filtroEtapa,
      filtroTipo,
      filtroCliente,
    ],
    queryFn: () =>
      listarProjetos({
        query: search,
        page: view === 'kanban' ? 0 : page,
        size: view === 'kanban' ? 100 : 30,
        etapa: filtroEtapa ? (filtroEtapa as EtapaProjeto) : undefined,
        tipo: filtroTipo ? (filtroTipo as TipoProjeto) : undefined,
        cliente_id: isAdmin && filtroCliente ? Number(filtroCliente) : undefined,
      }),
  })

  const detalhe = useQuery({
    queryKey: ['projeto-detalhe', viewing?.id],
    queryFn: () => listarProjetos({ id: viewing?.id, size: 1 }),
    enabled: Boolean(viewing),
  })

  const clientes = useQuery({
    queryKey: ['clientes-lookup'],
    queryFn: () => listarClientes({ page: 0, size: 100 }),
    enabled: isAdmin,
  })

  const sites = useQuery({
    queryKey: ['sites-lookup-projetos'],
    queryFn: () => listarSites({ page: 0, size: 100 }),
    enabled: isAdmin && open,
  })

  const apps = useQuery({
    queryKey: ['apps-lookup-projetos', form.cliente_id],
    queryFn: () =>
      listarAplicativosMobile({
        page: 0,
        size: 100,
        cliente_id: form.cliente_id ? Number(form.cliente_id) : undefined,
      }),
    enabled: isAdmin && open && Boolean(form.cliente_id),
  })

  const rows = list.data?.content ?? []
  const viewingDetalhe = detalhe.data?.content[0] ?? viewing
  const sitesDoCliente = (sites.data?.content ?? []).filter(
    (site) => !form.cliente_id || site.cliente_id === Number(form.cliente_id),
  )

  const save = useMutation({
    mutationFn: () => {
      const vinculo = parseVinculo(form.vinculo)
      const dados: ProjetoPayload = {
        cliente_id: Number(form.cliente_id),
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        etapa: form.etapa,
        site_id: vinculo.site_id,
        aplicativo_mobile_id: vinculo.aplicativo_mobile_id,
        prazo: form.prazo || undefined,
        descricao: form.descricao.trim() || undefined,
        observacao_interna: form.observacao_interna.trim() || undefined,
      }
      return editing ? alterarProjeto(editing.id, dados) : criarProjeto(dados)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
      setOpen(false)
      push(editing ? 'Projeto atualizado.' : 'Projeto criado.', 'success')
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const mover = useMutation({
    mutationFn: ({ id, etapa }: { id: number; etapa: EtapaProjeto }) => alterarEtapaProjeto(id, etapa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao mover o projeto.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarProjeto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
      setRemoving(null)
      push('Projeto excluído.', 'success')
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setOpen(true)
  }

  function openEdit(projeto: Projeto) {
    setEditing(projeto)
    setForm({
      cliente_id: String(projeto.cliente_id),
      titulo: projeto.titulo,
      tipo: projeto.tipo,
      etapa: projeto.etapa,
      vinculo: vinculoDe(projeto),
      prazo: projeto.prazo ?? '',
      descricao: projeto.descricao ?? '',
      observacao_interna: projeto.observacao_interna ?? '',
    })
    setErrors({})
    setOpen(true)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (isAdmin && !form.cliente_id) next.cliente_id = 'Selecione o cliente.'
    if (!form.titulo.trim()) next.titulo = 'Informe o título.'
    if (form.titulo.trim().length > 150) next.titulo = 'O título deve ter no máximo 150 caracteres.'
    if (form.descricao.length > 2000) next.descricao = 'A descrição deve ter no máximo 2000 caracteres.'
    if (form.observacao_interna.length > 2000) {
      next.observacao_interna = 'A observação deve ter no máximo 2000 caracteres.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onDropEtapa(etapa: EtapaProjeto) {
    if (!isAdmin || draggingId == null) return
    const atual = rows.find((row) => row.id === draggingId)
    if (!atual || atual.etapa === etapa) {
      setDraggingId(null)
      return
    }
    mover.mutate({ id: draggingId, etapa })
    setDraggingId(null)
  }

  const columns = useMemo<Column<Projeto>[]>(
    () => [
      {
        key: 'titulo',
        header: 'Projeto',
        render: (row) => (
          <div>
            <p className="font-semibold">{row.titulo}</p>
            <p className="text-xs text-muted">{vinculoLabel(row)}</p>
          </div>
        ),
      },
      ...(isAdmin
        ? [
            {
              key: 'cliente',
              header: 'Cliente',
              render: (row: Projeto) => row.cliente_nome_empresa || '—',
            } satisfies Column<Projeto>,
          ]
        : []),
      {
        key: 'tipo',
        header: 'Tipo',
        render: (row) => <TipoProjetoBadge tipo={row.tipo} />,
      },
      {
        key: 'etapa',
        header: 'Etapa',
        render: (row) => <EtapaProjetoBadge etapa={row.etapa} />,
      },
      {
        key: 'prazo',
        header: 'Prazo',
        render: (row) => (
          <span className={cn(isAtrasado(row) && 'font-semibold text-danger')}>
            {row.prazo ? formatDate(row.prazo) : '—'}
          </span>
        ),
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
              title="Visualizar"
              aria-label="Visualizar"
              icon={<Eye className="size-5" />}
              onClick={() => setViewing(row)}
            />
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Editar"
                  aria-label="Editar"
                  icon={<Pencil className="size-5" />}
                  onClick={() => openEdit(row)}
                />
                <Button
                  variant="ghost-danger"
                  size="sm"
                  title="Excluir"
                  aria-label="Excluir"
                  icon={<Trash2 className="size-5" />}
                  onClick={() => setRemoving(row)}
                />
              </>
            )}
          </div>
        ),
      },
    ],
    [isAdmin],
  )

  return (
    <PageFill>
      <PageHeader
        eyebrow="Operação"
        title={isAdmin ? 'Projetos' : 'Seus projetos'}
        description={
          isAdmin
            ? 'Acompanhe a entrega de BioLinks, sites e aplicativos. Arraste o card para mudar a etapa.'
            : 'Acompanhe a etapa e o prazo dos trabalhos da sua conta.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-xl border border-line bg-card p-1">
              <Button
                size="sm"
                variant={view === 'kanban' ? 'soft' : 'ghost'}
                icon={<Columns3 className="size-4" />}
                onClick={() => setView('kanban')}
              >
                Quadro
              </Button>
              <Button
                size="sm"
                variant={view === 'lista' ? 'soft' : 'ghost'}
                icon={<List className="size-4" />}
                onClick={() => setView('lista')}
              >
                Lista
              </Button>
            </div>
            {isAdmin ? (
              <Button icon={<Plus className="size-4" />} onClick={openCreate}>
                Novo projeto
              </Button>
            ) : undefined}
          </div>
        }
      />

      <DataTableShell
        toolbar={
          <div className={cn('grid gap-2', isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
            <SearchInput
              placeholder="Buscar por título, cliente ou briefing"
              value={query}
              onChange={(next) => {
                setQuery(next)
                setPage(0)
              }}
            />
            {isAdmin && (
              <Select
                label="Cliente"
                value={filtroCliente}
                onChange={(e) => {
                  setFiltroCliente(e.target.value)
                  setPage(0)
                }}
              >
                <option value="">Todos</option>
                {(clientes.data?.content ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome_empresa}
                  </option>
                ))}
              </Select>
            )}
            <Select
              label="Tipo"
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_PROJETO_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              label="Etapa"
              value={filtroEtapa}
              onChange={(e) => {
                setFiltroEtapa(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todas</option>
              {Object.entries(ETAPA_PROJETO_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        }
        footer={
          view === 'lista' ? (
            <Pagination
              page={list.data?.page ?? page}
              totalPages={list.data?.total_pages ?? 1}
              totalElements={list.data?.total_elements ?? 0}
              onPage={setPage}
            />
          ) : undefined
        }
      >
        {list.isLoading ? (
          <PageSpinner />
        ) : view === 'lista' ? (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="Nenhum projeto encontrado" />}
          />
        ) : (
          <div className="flex h-full min-h-0 gap-3 overflow-x-auto p-4 scrollbar-thin">
            {ETAPAS_PROJETO.filter((etapa) => !filtroEtapa || filtroEtapa === etapa).map((etapa) => {
              const cards = rows.filter((row) => row.etapa === etapa)
              return (
                <section
                  key={etapa}
                  className="flex w-72 shrink-0 flex-col rounded-2xl border border-line bg-paper/60"
                  onDragOver={(event) => {
                    if (!isAdmin) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    onDropEtapa(etapa)
                  }}
                >
                  <header className="flex items-center justify-between gap-2 px-3 py-3">
                    <EtapaProjetoBadge etapa={etapa} />
                    <span className="text-xs font-semibold text-muted">{cards.length}</span>
                  </header>
                  <div className="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3 scrollbar-thin">
                    {cards.map((projeto) => (
                      <article
                        key={projeto.id}
                        draggable={isAdmin}
                        onDragStart={() => {
                          dragged.current = false
                          setDraggingId(projeto.id)
                        }}
                        onDrag={() => {
                          dragged.current = true
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onClick={() => {
                          if (dragged.current) {
                            dragged.current = false
                            return
                          }
                          setViewing(projeto)
                        }}
                        className={cn(
                          'card-enter cursor-pointer rounded-2xl border border-line bg-card p-3 text-left shadow-sm transition-opacity',
                          isAdmin && 'cursor-grab active:cursor-grabbing',
                          draggingId === projeto.id && 'opacity-50',
                        )}
                      >
                        <p className="font-display text-sm font-semibold text-ink">{projeto.titulo}</p>
                        {isAdmin && (
                          <p className="mt-1 truncate text-xs text-muted">
                            {projeto.cliente_nome_empresa || '—'}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <TipoProjetoBadge tipo={projeto.tipo} />
                          {projeto.prazo ? (
                            <span
                              className={cn(
                                'text-[11px] font-semibold',
                                isAtrasado(projeto) ? 'text-danger' : 'text-muted',
                              )}
                            >
                              {formatDate(projeto.prazo)}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </DataTableShell>

      {isAdmin && (
        <Modal
          open={open}
          title={editing ? 'Editar projeto' : 'Novo projeto'}
          wide
          onClose={() => setOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button loading={save.isPending} onClick={() => validate() && save.mutate()}>
                Salvar
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Cliente"
              value={form.cliente_id}
              error={errors.cliente_id}
              onChange={(e) =>
                setForm((current) => ({ ...current, cliente_id: e.target.value, vinculo: '' }))
              }
            >
              <option value="">Selecione</option>
              {(clientes.data?.content ?? []).map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome_empresa}
                </option>
              ))}
            </Select>
            <Input
              label="Título"
              value={form.titulo}
              error={errors.titulo}
              onChange={(e) => setForm((current) => ({ ...current, titulo: e.target.value }))}
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm((current) => ({ ...current, tipo: e.target.value as TipoProjeto }))}
            >
              {Object.entries(TIPO_PROJETO_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              label="Etapa"
              value={form.etapa}
              onChange={(e) =>
                setForm((current) => ({ ...current, etapa: e.target.value as EtapaProjeto }))
              }
            >
              {Object.entries(ETAPA_PROJETO_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Prazo"
              type="date"
              value={form.prazo}
              onChange={(e) => setForm((current) => ({ ...current, prazo: e.target.value }))}
            />
            <Select
              label="Produto vinculado"
              value={form.vinculo}
              onChange={(e) => setForm((current) => ({ ...current, vinculo: e.target.value }))}
            >
              <option value="">Nenhum</option>
              {sitesDoCliente.map((site) => (
                <option key={`site:${site.id}`} value={`site:${site.id}`}>
                  Site · {site.nome}
                </option>
              ))}
              {(apps.data?.content ?? []).map((app) => (
                <option key={`app:${app.id}`} value={`app:${app.id}`}>
                  App · {app.nome}
                </option>
              ))}
            </Select>
            <Textarea
              label="Briefing"
              className="md:col-span-2"
              value={form.descricao}
              error={errors.descricao}
              onChange={(e) => setForm((current) => ({ ...current, descricao: e.target.value }))}
            />
            <Textarea
              label="Observação interna"
              className="md:col-span-2"
              value={form.observacao_interna}
              error={errors.observacao_interna}
              onChange={(e) =>
                setForm((current) => ({ ...current, observacao_interna: e.target.value }))
              }
            />
          </div>
        </Modal>
      )}

      <Modal
        open={Boolean(viewing)}
        title={viewingDetalhe?.titulo ?? 'Projeto'}
        onClose={() => setViewing(null)}
        footer={
          <div className="flex justify-end gap-2">
            {isAdmin && viewing && (
              <Button
                variant="secondary"
                onClick={() => {
                  openEdit(viewing)
                  setViewing(null)
                }}
              >
                Editar
              </Button>
            )}
            <Button onClick={() => setViewing(null)}>Fechar</Button>
          </div>
        }
      >
        {viewingDetalhe && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {isAdmin && (
                <Info label="Cliente" value={viewingDetalhe.cliente_nome_empresa || '—'} />
              )}
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Tipo</p>
                <div className="mt-1">
                  <TipoProjetoBadge tipo={viewingDetalhe.tipo} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Etapa</p>
                <div className="mt-1">
                  <EtapaProjetoBadge etapa={viewingDetalhe.etapa} />
                </div>
              </div>
              <Info
                label="Prazo"
                value={viewingDetalhe.prazo ? formatDate(viewingDetalhe.prazo) : '—'}
                danger={isAtrasado(viewingDetalhe)}
              />
              <Info label="Produto" value={vinculoLabel(viewingDetalhe)} />
            </div>
            {viewingDetalhe.descricao && (
              <div className="rounded-2xl bg-paper px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Briefing</p>
                <p className="mt-1 text-sm leading-6 text-ink whitespace-pre-wrap">
                  {viewingDetalhe.descricao}
                </p>
              </div>
            )}
            {isAdmin && viewingDetalhe.observacao_interna && (
              <div className="rounded-2xl bg-paper px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Observação interna
                </p>
                <p className="mt-1 text-sm leading-6 text-ink whitespace-pre-wrap">
                  {viewingDetalhe.observacao_interna}
                </p>
              </div>
            )}
            {(viewingDetalhe.historico_etapa ?? []).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  Histórico de etapas
                </p>
                <ol className="space-y-2">
                  {(viewingDetalhe.historico_etapa ?? []).map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-ink">
                        {item.etapa_anterior
                          ? `${ETAPA_PROJETO_LABEL[item.etapa_anterior]} → ${ETAPA_PROJETO_LABEL[item.etapa_nova]}`
                          : ETAPA_PROJETO_LABEL[item.etapa_nova]}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatDateTime(item.created_at)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir projeto"
        message={`Deseja excluir ${removing?.titulo}?`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </PageFill>
  )
}

function Info({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className={cn('mt-1 text-sm text-ink', danger && 'font-semibold text-danger')}>{value}</p>
    </div>
  )
}
