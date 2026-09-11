import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { alterarCliente, apagarCliente, criarCliente, listarClientes } from '@/lib/api/clientes'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDateTime, formatDocumento, formatTelefone, maskDocumento, maskTelefone, onlyDigits } from '@/lib/format'
import { isValidDocumento, isValidEmail, isValidPassword } from '@/lib/validators'
import { useToast } from '@/context/ToastContext'
import type { Cliente } from '@/types/models'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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

interface FormState {
  nome_empresa: string
  documento: string
  email: string
  senha: string
  telefone: string
  foto?: File | null
}

const emptyForm: FormState = {
  nome_empresa: '',
  documento: '',
  email: '',
  senha: '',
  telefone: '',
  foto: null,
}

export function ClientesPage() {
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const search = useDebouncedValue(query)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['clientes', search, page],
    queryFn: () => listarClientes({ query: search, page, size: 30 }),
  })

  const save = useMutation({
    mutationFn: async () => {
      const dados = {
        nome_empresa: form.nome_empresa,
        documento: onlyDigits(form.documento),
        email: form.email,
        telefone: onlyDigits(form.telefone) || undefined,
        senha: form.senha,
      }
      if (editing) {
        return alterarCliente(editing.id, { ...dados, senha: form.senha || undefined }, form.foto)
      }
      return criarCliente(dados, form.foto)
    },
    onSuccess: () => {
      push(editing ? 'Cliente atualizado.' : 'Cliente criado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setOpen(false)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarCliente(id),
    onSuccess: () => {
      push('Cliente excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setRemoving(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  function validate() {
    const next: Record<string, string> = {}
    if (!form.nome_empresa.trim()) next.nome_empresa = 'Informe a empresa.'
    if (!isValidDocumento(form.documento)) next.documento = 'CPF ou CNPJ inválido.'
    if (!isValidEmail(form.email)) next.email = 'E-mail inválido.'
    if (!isValidPassword(form.senha, !editing)) next.senha = 'Mínimo de 8 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const columns = useMemo<Column<Cliente>[]>(
    () => [
      {
        key: 'empresa',
        header: 'Cliente',
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.nome_empresa} src={row.foto} />
            <p className="font-semibold">{row.nome_empresa}</p>
          </div>
        ),
      },
      { key: 'email', header: 'E-mail', render: (row) => row.email || '—' },
      {
        key: 'doc',
        header: 'Documento',
        className: 'whitespace-nowrap tabular-nums',
        render: (row) => formatDocumento(row.documento),
      },
      {
        key: 'tel',
        header: 'Telefone',
        className: 'whitespace-nowrap tabular-nums',
        render: (row) => formatTelefone(row.telefone),
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
              icon={<Pencil className="size-5" />}
              onClick={() => {
                setEditing(row)
                setForm({
                  nome_empresa: row.nome_empresa,
                  documento: maskDocumento(row.documento ?? ''),
                  email: row.email,
                  senha: '',
                  telefone: maskTelefone(row.telefone ?? ''),
                  foto: null,
                })
                setErrors({})
                setOpen(true)
              }}
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
        eyebrow="Carteira"
        title="Clientes"
        description="Empresas atendidas pela Convertix e seus dados de acesso."
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
            Novo cliente
          </Button>
        }
      />

      <DataTableShell
        toolbar={
          <SearchInput
            placeholder="Buscar por empresa, documento ou e-mail"
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
            empty={<EmptyState title="Nenhum cliente encontrado" />}
          />
        )}
      </DataTableShell>

      <Modal
        open={open}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
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
          <PhotoPicker name={form.nome_empresa} currentUrl={editing?.foto} file={form.foto} onChange={(foto) => setForm((f) => ({ ...f, foto }))} />
          <Input label="Empresa" value={form.nome_empresa} error={errors.nome_empresa} onChange={(e) => setForm((f) => ({ ...f, nome_empresa: e.target.value }))} />
          <Input
            label="CPF ou CNPJ"
            value={form.documento}
            error={errors.documento}
            onChange={(e) => setForm((f) => ({ ...f, documento: maskDocumento(e.target.value) }))}
          />
          <Input label="E-mail" type="email" value={form.email} error={errors.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm((f) => ({ ...f, telefone: maskTelefone(e.target.value) }))}
          />
          <Input
            label={editing ? 'Nova senha (opcional)' : 'Senha'}
            type="password"
            value={form.senha}
            error={errors.senha}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir cliente"
        message={`Deseja excluir ${removing?.nome_empresa}?`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </PageFill>
  )
}
