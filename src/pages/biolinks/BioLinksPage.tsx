import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  alterarBioLink,
  apagarBioLink,
  criarBioLink,
  listarBioLinks,
} from '@/lib/api/biolinks'
import { listarSites } from '@/lib/api/sites'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { isValidNomeUsuario } from '@/lib/validators'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { TipoSite } from '@/types/enums'
import type { BioLink } from '@/types/models'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/Select'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'
import { BioLinkItensDialog } from './BioLinkItensDialog'

export function BioLinksPage() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BioLink | null>(null)
  const [removing, setRemoving] = useState<BioLink | null>(null)
  const [itensOf, setItensOf] = useState<BioLink | null>(null)
  const [form, setForm] = useState({ site_id: '', nome_usuario: '', descricao: '', foto: null as File | null })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['biolinks', page],
    queryFn: () => listarBioLinks({ page, size: 30 }),
  })
  const sites = useQuery({
    queryKey: ['sites-biolink'],
    queryFn: () => listarSites({ page: 0, size: 100 }),
    enabled: isAdmin,
  })

  const rows = (list.data?.content ?? []).filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [item.nome_usuario, item.site_nome, item.descricao, String(item.id)]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  })

  const save = useMutation({
    mutationFn: async () => {
      const dados = {
        site_id: Number(form.site_id),
        nome_usuario: form.nome_usuario,
        descricao: form.descricao || undefined,
      }
      return editing ? alterarBioLink(editing.id, dados, form.foto) : criarBioLink(dados, form.foto)
    },
    onSuccess: () => {
      push(editing ? 'BioLink atualizado.' : 'BioLink criado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['biolinks'] })
      setOpen(false)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarBioLink(id),
    onSuccess: () => {
      push('BioLink excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['biolinks'] })
      setRemoving(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  const sitesDisponiveis = (sites.data?.content ?? []).filter((s) => s.tipo === TipoSite.BIOLINK)

  const columns = useMemo<Column<BioLink>[]>(
    () => [
      {
        key: 'bio',
        header: 'BioLink',
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.nome_usuario} src={row.foto_perfil} />
            <p className="font-semibold">{row.nome_usuario}</p>
          </div>
        ),
      },
      { key: 'site', header: 'Site', render: (row) => row.site_nome || '—' },
      { key: 'desc', header: 'Descrição', render: (row) => row.descricao || '—' },
      { key: 'created', header: 'Atualizado', render: (row) => formatDateTime(row.updated_at) },
      {
        key: 'acoes',
        header: '',
        className: 'text-right',
        render: (row) => (
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              title="Links"
              aria-label="Links"
              icon={<Link2 className="size-5" />}
              onClick={() => setItensOf(row)}
            />
            <Button
              variant="ghost"
              size="sm"
              title="Editar"
              aria-label="Editar"
              icon={<Pencil className="size-5" />}
              onClick={() => {
                setEditing(row)
                setForm({
                  site_id: String(row.site_id),
                  nome_usuario: row.nome_usuario,
                  descricao: row.descricao ?? '',
                  foto: null,
                })
                setErrors({})
                setOpen(true)
              }}
            />
            {isAdmin && (
              <Button
                variant="ghost-danger"
                size="sm"
                title="Excluir"
                aria-label="Excluir"
                icon={<Trash2 className="size-5" />}
                onClick={() => setRemoving(row)}
              />
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
        eyebrow="Presença"
        title={isAdmin ? 'BioLinks' : 'Seu BioLink'}
        description="Perfil público e até 8 links para redes, WhatsApp e conteúdos."
        actions={
          isAdmin ? (
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null)
                setForm({ site_id: '', nome_usuario: '', descricao: '', foto: null })
                setErrors({})
                setOpen(true)
              }}
            >
              Novo BioLink
            </Button>
          ) : undefined
        }
      />

      <DataTableShell
        toolbar={
          <SearchInput
            placeholder="Filtrar por usuário, site ou descrição"
            value={query}
            onChange={setQuery}
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
          <Table columns={columns} rows={rows} rowKey={(row) => row.id} empty={<EmptyState title="Nenhum BioLink encontrado" />} />
        )}
      </DataTableShell>

      <Modal
        open={open}
        title={editing ? 'Editar BioLink' : 'Novo BioLink'}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              loading={save.isPending}
              onClick={() => {
                const next: Record<string, string> = {}
                if (!form.site_id) next.site_id = 'Selecione o site.'
                if (!isValidNomeUsuario(form.nome_usuario)) next.nome_usuario = 'Use 3 a 50 caracteres.'
                setErrors(next)
                if (!Object.keys(next).length) save.mutate()
              }}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <PhotoPicker name={form.nome_usuario} currentUrl={editing?.foto_perfil} file={form.foto} onChange={(foto) => setForm((f) => ({ ...f, foto }))} />
          <Select
            label="Site"
            value={form.site_id}
            error={errors.site_id}
            disabled={Boolean(editing)}
            onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))}
          >
            <option value="">Selecione um site BioLink</option>
            {sitesDisponiveis.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
            {editing && !sitesDisponiveis.some((s) => s.id === editing.site_id) && (
              <option value={editing.site_id}>{editing.site_nome}</option>
            )}
          </Select>
          <Input label="Nome de usuário" value={form.nome_usuario} error={errors.nome_usuario} onChange={(e) => setForm((f) => ({ ...f, nome_usuario: e.target.value }))} />
          <Textarea label="Descrição" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir BioLink"
        message={`Deseja excluir o BioLink de ${removing?.nome_usuario}?`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />

      {itensOf && <BioLinkItensDialog biolink={itensOf} onClose={() => setItensOf(null)} />}
    </PageFill>
  )
}
