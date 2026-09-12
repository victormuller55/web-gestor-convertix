import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FileInput, Pencil, Plus, Trash2, Users } from 'lucide-react'
import {
  alterarLandingPage,
  apagarLandingPage,
  criarLandingPage,
  listarLandingPages,
} from '@/lib/api/landingPages'
import { listarSites } from '@/lib/api/sites'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDateTime } from '@/lib/format'
import { TipoSite } from '@/types/enums'
import type { LandingPage } from '@/types/models'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/Select'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'
import { LandingPageFormulariosDialog } from './LandingPageFormulariosDialog'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export function LandingPagesPage() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const search = useDebouncedValue(query)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LandingPage | null>(null)
  const [removing, setRemoving] = useState<LandingPage | null>(null)
  const [formsOf, setFormsOf] = useState<LandingPage | null>(null)
  const [form, setForm] = useState({ site_id: '', slug: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['landing-pages', search, page],
    queryFn: () => listarLandingPages({ query: search, page, size: 30 }),
  })
  const sites = useQuery({
    queryKey: ['sites-landing-page'],
    queryFn: () => listarSites({ page: 0, size: 100 }),
    enabled: isAdmin && open,
  })
  const todas = useQuery({
    queryKey: ['landing-pages-lookup'],
    queryFn: () => listarLandingPages({ page: 0, size: 100 }),
    enabled: isAdmin && open,
  })

  const ocupados = useMemo(() => {
    const set = new Set<number>()
    for (const item of todas.data?.content ?? []) {
      if (!editing || item.id !== editing.id) set.add(item.site_id)
    }
    return set
  }, [todas.data, editing])

  const sitesDisponiveis = useMemo(
    () =>
      (sites.data?.content ?? []).filter(
        (site) => site.tipo === TipoSite.LANDING_PAGE && !ocupados.has(site.id),
      ),
    [sites.data, ocupados],
  )

  const save = useMutation({
    mutationFn: () => {
      const dados = { site_id: Number(form.site_id), slug: form.slug }
      return editing ? alterarLandingPage(editing.id, dados) : criarLandingPage(dados)
    },
    onSuccess: () => {
      push(editing ? 'Landing page atualizada.' : 'Landing page criada.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      setOpen(false)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarLandingPage(id),
    onSuccess: () => {
      push('Landing page excluída.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      setRemoving(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  function openCreate() {
    setEditing(null)
    setForm({ site_id: '', slug: '' })
    setErrors({})
    setOpen(true)
  }

  function openEdit(row: LandingPage) {
    setEditing(row)
    setForm({ site_id: String(row.site_id), slug: row.slug })
    setErrors({})
    setOpen(true)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.site_id) next.site_id = 'Selecione o site.'
    if (!/^[a-z0-9-]{2,100}$/.test(form.slug)) next.slug = 'Use 2 a 100 caracteres: letras, números e hífen.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const columns = useMemo<Column<LandingPage>[]>(
    () => [
      {
        key: 'site',
        header: 'Landing page',
        render: (row) => (
          <div>
            <p className="font-semibold">{row.site_nome || row.slug}</p>
            <p className="text-xs text-muted">/{row.slug}</p>
          </div>
        ),
      },
      {
        key: 'cliente',
        header: 'Cliente',
        render: (row) => row.cliente_nome_empresa || '—',
      },
      {
        key: 'forms',
        header: 'Formulários',
        render: (row) => row.quantidade_formularios ?? 0,
      },
      {
        key: 'leads',
        header: 'Leads',
        render: (row) => row.quantidade_leads ?? 0,
      },
      {
        key: 'updated',
        header: 'Atualizado',
        render: (row) => formatDateTime(row.updated_at),
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
              title="Formulários"
              aria-label="Formulários"
              icon={<FileInput className="size-5" />}
              onClick={() => setFormsOf(row)}
            />
            <Button
              variant="ghost"
              size="sm"
              title="Leads"
              aria-label="Leads"
              icon={<Users className="size-5" />}
              onClick={() => navigate(`/leads?landing_page_id=${row.id}`)}
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
    [isAdmin, navigate],
  )

  return (
    <PageFill>
      <PageHeader
        eyebrow="Produtos"
        title="Landing Pages"
        description="Páginas de captura com formulários e leads. O site precisa ser do tipo Landing Page."
        actions={
          isAdmin ? (
            <Button icon={<Plus className="size-4" />} onClick={openCreate}>
              Nova landing page
            </Button>
          ) : undefined
        }
      />

      <DataTableShell
        toolbar={
          <SearchInput
            placeholder="Buscar por slug, site ou cliente"
            value={query}
            onChange={(next) => {
              setQuery(next)
              setPage(0)
            }}
          />
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
            empty={<EmptyState title="Nenhuma landing page encontrada" />}
          />
        )}
      </DataTableShell>

      <Modal
        open={open}
        title={editing ? 'Editar landing page' : 'Nova landing page'}
        description="Uma landing page por site. O slug é o endereço público do formulário."
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
        <div className="space-y-4">
          <Select
            label="Site"
            value={form.site_id}
            error={errors.site_id}
            disabled={Boolean(editing)}
            onChange={(e) => {
              const siteId = e.target.value
              const site = sitesDisponiveis.find((item) => String(item.id) === siteId)
              setForm((current) => ({
                ...current,
                site_id: siteId,
                slug: current.slug || slugify(site?.subdominio || site?.nome || ''),
              }))
            }}
          >
            <option value="">Selecione um site Landing Page</option>
            {sitesDisponiveis.map((site) => (
              <option key={site.id} value={site.id}>
                {site.nome}
              </option>
            ))}
            {editing && !sitesDisponiveis.some((site) => site.id === editing.site_id) && (
              <option value={editing.site_id}>{editing.site_nome}</option>
            )}
          </Select>
          <Input
            label="Slug"
            hint="Só letras minúsculas, números e hífen."
            value={form.slug}
            error={errors.slug}
            onChange={(e) => setForm((current) => ({ ...current, slug: slugify(e.target.value) }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir landing page"
        message={`Deseja excluir ${removing?.site_nome}? Formulários e leads também saem.`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />

      {formsOf ? <LandingPageFormulariosDialog landingPage={formsOf} onClose={() => setFormsOf(null)} /> : null}
    </PageFill>
  )
}
