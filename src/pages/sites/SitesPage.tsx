import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { alterarSite, apagarSite, criarSite } from '@/lib/api/sites'
import { listarSites } from '@/lib/api/sites'
import { listarClientes } from '@/lib/api/clientes'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { dominioParaApi, normalizeUrl, urlPublicaSite } from '@/lib/links'
import { formatCurrencyInput, formatDate, formatMoney, parseCurrency } from '@/lib/format'
import { isValidSubdominio } from '@/lib/validators'
import { StatusSite, TipoSite } from '@/types/enums'
import type { Site } from '@/types/models'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { CurrencyInput, Input, Select } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/Select'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'
import { SituacaoBadge, StatusSiteBadge, TipoSiteBadge } from '@/components/status/badges'
import { STATUS_SITE_LABEL, TIPO_SITE_LABEL } from '@/lib/labels'

interface FormState {
  cliente_id: string
  nome: string
  tipo: TipoSite
  dominio: string
  subdominio: string
  status: StatusSite
  valor_dominio: string
  data_compra_dominio: string
  data_fim_dominio: string
  data_renovacao: string
}

const emptyForm: FormState = {
  cliente_id: '',
  nome: '',
  tipo: TipoSite.BIOLINK,
  dominio: '',
  subdominio: '',
  status: StatusSite.EM_DESENVOLVIMENTO,
  valor_dominio: '',
  data_compra_dominio: '',
  data_fim_dominio: '',
  data_renovacao: '',
}

export function SitesPage() {
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const search = useDebouncedValue(query)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Site | null>(null)
  const [removing, setRemoving] = useState<Site | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['sites', search, page],
    queryFn: () => listarSites({ query: search, page, size: 30 }),
  })
  const clientes = useQuery({
    queryKey: ['clientes-lookup'],
    queryFn: () => listarClientes({ page: 0, size: 100 }),
  })

  const rows = (list.data?.content ?? []).filter((site) => {
    if (filtroStatus && site.status !== filtroStatus) return false
    if (filtroTipo && site.tipo !== filtroTipo) return false
    return true
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        cliente_id: Number(form.cliente_id),
        nome: form.nome,
        tipo: form.tipo,
        dominio: form.dominio ? dominioParaApi(form.dominio) : undefined,
        subdominio: form.subdominio || undefined,
        status: form.status,
        dominio_info: form.dominio
          ? {
              valor_dominio: form.valor_dominio ? parseCurrency(form.valor_dominio) : null,
              data_compra_dominio: form.data_compra_dominio || null,
              data_fim_dominio: form.data_fim_dominio || null,
              data_renovacao: form.data_renovacao || null,
            }
          : null,
      }
      return editing ? alterarSite(editing.id, payload) : criarSite(payload)
    },
    onSuccess: () => {
      push(editing ? 'Site atualizado.' : 'Site criado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      setOpen(false)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarSite(id),
    onSuccess: () => {
      push('Site excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      setRemoving(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  function openEdit(site: Site) {
    setEditing(site)
    setForm({
      cliente_id: String(site.cliente_id),
      nome: site.nome,
      tipo: site.tipo,
      dominio: site.dominio ?? '',
      subdominio: site.subdominio ?? '',
      status: site.status,
      valor_dominio: formatCurrencyInput(site.dominio_info?.valor_dominio),
      data_compra_dominio: site.dominio_info?.data_compra_dominio ?? '',
      data_fim_dominio: site.dominio_info?.data_fim_dominio ?? '',
      data_renovacao: site.dominio_info?.data_renovacao ?? '',
    })
    setErrors({})
    setOpen(true)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.cliente_id) next.cliente_id = 'Selecione o cliente.'
    if (!form.nome.trim()) next.nome = 'Informe o nome.'
    if (form.subdominio && !isValidSubdominio(form.subdominio)) next.subdominio = 'Use letras, números e hífen.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const columns = useMemo<Column<Site>[]>(
    () => [
      {
        key: 'nome',
        header: 'Site',
        render: (row) => <p className="font-semibold">{row.nome}</p>,
      },
      {
        key: 'cliente',
        header: 'Cliente',
        render: (row) => row.cliente_nome_empresa || '—',
      },
      { key: 'tipo', header: 'Tipo', render: (row) => <TipoSiteBadge tipo={row.tipo} /> },
      { key: 'status', header: 'Status', render: (row) => <StatusSiteBadge status={row.status} /> },
      { key: 'sit', header: 'Assinatura', render: (row) => <SituacaoBadge status={row.situacao_assinatura} /> },
      {
        key: 'url',
        header: 'Endereço',
        render: (row) => {
          const host = urlPublicaSite(row.dominio, row.subdominio)
          if (!host) return '—'
          return (
            <a
              href={normalizeUrl(host)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-info hover:underline"
            >
              {host}
              <ExternalLink className="size-3.5" />
            </a>
          )
        },
      },
      {
        key: 'dom_valor',
        header: 'Valor domínio',
        render: (row) =>
          row.dominio_info?.valor_dominio != null ? formatMoney(row.dominio_info.valor_dominio) : '—',
      },
      {
        key: 'dom_venc',
        header: 'Vence domínio',
        render: (row) => formatDate(row.dominio_info?.data_fim_dominio),
      },
      {
        key: 'acoes',
        header: '',
        className: 'text-right',
        render: (row) => (
          <div className="flex gap-4">
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
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <PageFill>
      <PageHeader
        eyebrow="Produtos"
        title="Sites"
        description="BioLinks, landing pages e sites comerciais sob gestão."
        actions={
          <Button
            icon={<Plus className="size-4" />}
            onClick={() => {
              setEditing(null)
              setForm(emptyForm)
              setErrors({})
              setOpen(true)
            }}
          >
            Novo site
          </Button>
        }
      />

      <DataTableShell
        toolbar={
          <div className="grid gap-2 md:grid-cols-3">
            <SearchInput
              placeholder="Buscar por nome, domínio ou subdomínio"
              value={query}
              onChange={(next) => {
                setQuery(next)
                setPage(0)
              }}
            />
            <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_SITE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_SITE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
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
          <Table columns={columns} rows={rows} rowKey={(row) => row.id} empty={<EmptyState title="Nenhum site encontrado" />} />
        )}
      </DataTableShell>

      <Modal
        open={open}
        title={editing ? 'Editar site' : 'Novo site'}
        wide
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button loading={save.isPending} onClick={() => validate() && save.mutate()}>Salvar</Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Cliente" value={form.cliente_id} error={errors.cliente_id} onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}>
            <option value="">Selecione</option>
            {(clientes.data?.content ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.nome_empresa}</option>
            ))}
          </Select>
          <Input label="Nome" value={form.nome} error={errors.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          <Select label="Tipo" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoSite }))}>
            {Object.entries(TIPO_SITE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusSite }))}>
            {Object.entries(STATUS_SITE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Domínio" placeholder="convertix.net.br" value={form.dominio} onChange={(e) => setForm((f) => ({ ...f, dominio: e.target.value }))} />
          <Input label="Subdomínio" placeholder="cliente" value={form.subdominio} error={errors.subdominio} onChange={(e) => setForm((f) => ({ ...f, subdominio: e.target.value.toLowerCase() }))} />
          {form.dominio && (
            <>
              <CurrencyInput label="Valor do domínio" value={form.valor_dominio} onChange={(e) => setForm((f) => ({ ...f, valor_dominio: e.target.value }))} />
              <Input label="Compra" type="date" value={form.data_compra_dominio} onChange={(e) => setForm((f) => ({ ...f, data_compra_dominio: e.target.value }))} />
              <Input label="Vencimento" type="date" value={form.data_fim_dominio} onChange={(e) => setForm((f) => ({ ...f, data_fim_dominio: e.target.value }))} />
              <Input label="Renovação" type="date" value={form.data_renovacao} onChange={(e) => setForm((f) => ({ ...f, data_renovacao: e.target.value }))} />
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir site"
        message={`Deseja excluir ${removing?.nome}?`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </PageFill>
  )
}
