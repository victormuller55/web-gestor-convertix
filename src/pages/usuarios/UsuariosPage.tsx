import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { alterarUsuario, apagarUsuario, criarUsuario, listarUsuarios } from '@/lib/api/usuarios'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDateTime } from '@/lib/format'
import { TIPO_USUARIO_LABEL } from '@/lib/labels'
import { isValidEmail, isValidPassword } from '@/lib/validators'
import { useToast } from '@/context/ToastContext'
import type { Usuario } from '@/types/models'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'

interface FormState {
  nome: string
  email: string
  senha: string
  ativo: boolean
  foto?: File | null
}

const emptyForm: FormState = { nome: '', email: '', senha: '', ativo: true, foto: null }

export function UsuariosPage() {
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const search = useDebouncedValue(query)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState<Usuario | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['usuarios', search, page],
    queryFn: () => listarUsuarios({ query: search, page, size: 30 }),
  })

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        return alterarUsuario(
          editing.id,
          { nome: form.nome, email: form.email, senha: form.senha || undefined, ativo: form.ativo },
          form.foto,
        )
      }
      return criarUsuario(
        { nome: form.nome, email: form.email, senha: form.senha, ativo: form.ativo },
        form.foto,
      )
    },
    onSuccess: () => {
      push(editing ? 'Usuário atualizado.' : 'Usuário criado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setOpen(false)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarUsuario(id),
    onSuccess: () => {
      push('Usuário excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setRemoving(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setOpen(true)
  }

  function openEdit(user: Usuario) {
    setEditing(user)
    setForm({ nome: user.nome, email: user.email, senha: '', ativo: user.ativo, foto: null })
    setErrors({})
    setOpen(true)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.nome.trim()) next.nome = 'Informe o nome.'
    if (!isValidEmail(form.email)) next.email = 'E-mail inválido.'
    if (!isValidPassword(form.senha, !editing)) next.senha = 'Mínimo de 8 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const columns = useMemo<Column<Usuario>[]>(
    () => [
      {
        key: 'nome',
        header: 'Usuário',
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.nome} src={row.foto} />
            <p className="font-semibold">{row.nome}</p>
          </div>
        ),
      },
      { key: 'email', header: 'E-mail', render: (row) => row.email || '—' },
      { key: 'tipo', header: 'Tipo', render: (row) => TIPO_USUARIO_LABEL[row.tipo] },
      {
        key: 'ativo',
        header: 'Status',
        render: (row) => <Badge tone={row.ativo ? 'success' : 'neutral'}>{row.ativo ? 'Ativo' : 'Inativo'}</Badge>,
      },
      { key: 'created', header: 'Criado', render: (row) => formatDateTime(row.created_at) },
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
              onClick={() => openEdit(row)}
              icon={<Pencil className="size-5" />}
            />
            <Button
              variant="ghost-danger"
              size="sm"
              title="Excluir"
              aria-label="Excluir"
              onClick={() => setRemoving(row)}
              icon={<Trash2 className="size-5" />}
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
        eyebrow="Administração"
        title="Usuários internos"
        description="Quem acessa o gestor com perfil de administrador."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            Novo usuário
          </Button>
        }
      />

      <DataTableShell
        toolbar={
          <SearchInput
            placeholder="Buscar por nome ou e-mail"
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
            empty={<EmptyState title="Nenhum usuário encontrado" />}
          />
        )}
      </DataTableShell>

      <Modal
        open={open}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              loading={save.isPending}
              onClick={() => {
                if (validate()) save.mutate()
              }}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <PhotoPicker name={form.nome} currentUrl={editing?.foto} file={form.foto} onChange={(foto) => setForm((f) => ({ ...f, foto }))} />
          <Input label="Nome" value={form.nome} error={errors.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          <Input label="E-mail" type="email" value={form.email} error={errors.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input
            label={editing ? 'Nova senha (opcional)' : 'Senha'}
            type="password"
            value={form.senha}
            error={errors.senha}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
          />
          <Switch checked={form.ativo} onChange={(ativo) => setForm((f) => ({ ...f, ativo }))} label="Usuário ativo" />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir usuário"
        message={`Deseja excluir ${removing?.nome}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </PageFill>
  )
}
