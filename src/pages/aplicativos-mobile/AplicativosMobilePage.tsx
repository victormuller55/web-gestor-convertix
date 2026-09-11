import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  alterarAplicativoMobile,
  apagarAplicativoMobile,
  criarAplicativoMobile,
  enviarDocumentoAplicativoMobile,
  listarAplicativosMobile,
  removerDocumentoAplicativoMobile,
  type AplicativoMobilePayload,
} from '@/lib/api/aplicativosMobile'
import { listarClientes } from '@/lib/api/clientes'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDateTime } from '@/lib/format'
import { normalizeUrl } from '@/lib/links'
import { isValidAndroidPackage, isValidHttpUrl, isValidIosBundleId } from '@/lib/validators'
import { StatusAplicativoMobile } from '@/types/enums'
import type { AplicativoMobile } from '@/types/models'
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
import { PdfPicker } from '@/components/ui/PdfPicker'
import { StatusAplicativoMobileBadge } from '@/components/status/badges'
import { STATUS_APLICATIVO_MOBILE_LABEL } from '@/lib/labels'

interface FormState {
  cliente_id: string
  nome: string
  descricao: string
  status: StatusAplicativoMobile
  package_android: string
  versao_android: string
  url_android: string
  bundle_id_ios: string
  versao_ios: string
  url_ios: string
  documento: File | null
  removerDocumento: boolean
}

const emptyForm: FormState = {
  cliente_id: '',
  nome: '',
  descricao: '',
  status: StatusAplicativoMobile.DESENVOLVIMENTO,
  package_android: '',
  versao_android: '',
  url_android: '',
  bundle_id_ios: '',
  versao_ios: '',
  url_ios: '',
  documento: null,
  removerDocumento: false,
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export function AplicativosMobilePage() {
  const { isAdmin, user } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const search = useDebouncedValue(query)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AplicativoMobile | null>(null)
  const [viewing, setViewing] = useState<AplicativoMobile | null>(null)
  const [removing, setRemoving] = useState<AplicativoMobile | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['aplicativos-mobile', user?.id, search, page, filtroStatus, filtroCliente],
    queryFn: () =>
      listarAplicativosMobile({
        query: search,
        page,
        size: 30,
        status: filtroStatus ? (filtroStatus as StatusAplicativoMobile) : undefined,
        cliente_id: isAdmin && filtroCliente ? Number(filtroCliente) : undefined,
      }),
  })
  const clientes = useQuery({
    queryKey: ['clientes-lookup'],
    queryFn: () => listarClientes({ page: 0, size: 100 }),
    enabled: isAdmin,
  })

  const rows = list.data?.content ?? []

  function toPayload(): AplicativoMobilePayload {
    return {
      cliente_id: isAdmin ? Number(form.cliente_id) : Number(user?.cliente_id),
      nome: form.nome.trim(),
      descricao: optional(form.descricao),
      status: form.status,
      package_android: optional(form.package_android),
      bundle_id_ios: optional(form.bundle_id_ios),
      versao_android: optional(form.versao_android),
      versao_ios: optional(form.versao_ios),
      url_android: optional(form.url_android) ? normalizeUrl(form.url_android) : undefined,
      url_ios: optional(form.url_ios) ? normalizeUrl(form.url_ios) : undefined,
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = toPayload()
      const saved = editing
        ? await alterarAplicativoMobile(editing.id, payload)
        : await criarAplicativoMobile(payload)

      if (form.documento) {
        return enviarDocumentoAplicativoMobile(saved.id, form.documento)
      }
      if (editing && form.removerDocumento && saved.documento_requisitos_url) {
        return removerDocumentoAplicativoMobile(saved.id)
      }
      return saved
    },
    onSuccess: () => {
      push(editing ? 'Aplicativo atualizado.' : 'Aplicativo criado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['aplicativos-mobile'] })
      setOpen(false)
    },
    onError: (err) =>
      push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarAplicativoMobile(id),
    onSuccess: () => {
      push('Aplicativo excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['aplicativos-mobile'] })
      setRemoving(null)
    },
    onError: (err) =>
      push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  const uploadView = useMutation({
    mutationFn: (arquivo: File) => enviarDocumentoAplicativoMobile(viewing!.id, arquivo),
    onSuccess: (saved) => {
      push('Documento enviado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['aplicativos-mobile'] })
      setViewing(saved)
    },
    onError: (err) =>
      push(err instanceof ApiError ? err.message : 'Falha no upload do PDF.', 'error'),
  })

  const removeDocView = useMutation({
    mutationFn: () => removerDocumentoAplicativoMobile(viewing!.id),
    onSuccess: (saved) => {
      push('Documento removido.', 'success')
      queryClient.invalidateQueries({ queryKey: ['aplicativos-mobile'] })
      setViewing(saved)
    },
    onError: (err) =>
      push(err instanceof ApiError ? err.message : 'Falha ao remover o PDF.', 'error'),
  })

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      cliente_id: isAdmin ? '' : String(user?.cliente_id ?? ''),
    })
    setErrors({})
    setOpen(true)
  }

  function openEdit(app: AplicativoMobile) {
    setEditing(app)
    setForm({
      cliente_id: String(app.cliente_id),
      nome: app.nome,
      descricao: app.descricao ?? '',
      status: app.status,
      package_android: app.package_android ?? '',
      versao_android: app.versao_android ?? '',
      url_android: app.url_android ?? '',
      bundle_id_ios: app.bundle_id_ios ?? '',
      versao_ios: app.versao_ios ?? '',
      url_ios: app.url_ios ?? '',
      documento: null,
      removerDocumento: false,
    })
    setErrors({})
    setOpen(true)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (isAdmin && !form.cliente_id) next.cliente_id = 'Selecione o cliente.'
    if (!form.nome.trim()) next.nome = 'Informe o nome.'
    if (form.nome.trim().length > 150) next.nome = 'O nome deve ter no máximo 150 caracteres.'
    if (form.descricao.length > 500) next.descricao = 'A descrição deve ter no máximo 500 caracteres.'
    if (form.package_android && !isValidAndroidPackage(form.package_android)) {
      next.package_android = 'Package Android inválido.'
    }
    if (form.bundle_id_ios && !isValidIosBundleId(form.bundle_id_ios)) {
      next.bundle_id_ios = 'Bundle ID iOS inválido.'
    }
    if (form.url_android && !isValidHttpUrl(form.url_android)) {
      next.url_android = 'Informe um link válido.'
    }
    if (form.url_ios && !isValidHttpUrl(form.url_ios)) {
      next.url_ios = 'Informe um link válido.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const columns = useMemo<Column<AplicativoMobile>[]>(
    () => [
      {
        key: 'nome',
        header: 'Nome',
        render: (row) => <p className="font-semibold">{row.nome}</p>,
      },
      ...(isAdmin
        ? [
            {
              key: 'cliente',
              header: 'Cliente',
              render: (row: AplicativoMobile) => row.cliente_nome_empresa || '—',
            } satisfies Column<AplicativoMobile>,
          ]
        : []),
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusAplicativoMobileBadge status={row.status} />,
      },
      {
        key: 'v_android',
        header: 'Versão Android',
        render: (row) => row.versao_android || '—',
      },
      {
        key: 'v_ios',
        header: 'Versão iOS',
        render: (row) => row.versao_ios || '—',
      },
      {
        key: 'atualizado',
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

  const documentoAtual = form.removerDocumento ? null : editing?.documento_requisitos_url

  return (
    <PageFill>
      <PageHeader
        eyebrow="Produtos"
        title={isAdmin ? 'Aplicativos Mobile' : 'Seus aplicativos'}
        description={
          isAdmin
            ? 'Apps Android e iOS vinculados diretamente aos clientes.'
            : 'Consulte os aplicativos da sua conta. Somente a equipe Convertix pode alterar esses dados.'
        }
        actions={
          isAdmin ? (
            <Button icon={<Plus className="size-4" />} onClick={openCreate}>
              Novo aplicativo
            </Button>
          ) : undefined
        }
      />

      <DataTableShell
        toolbar={
          <div className={isAdmin ? 'grid gap-2 md:grid-cols-3' : 'grid gap-2 md:grid-cols-2'}>
            <SearchInput
              placeholder="Buscar por nome, package ou bundle"
              value={query}
              onChange={(next) => {
                setQuery(next)
                setPage(0)
              }}
            />
            {isAdmin && (
              <Select
                value={filtroCliente}
                onChange={(e) => {
                  setFiltroCliente(e.target.value)
                  setPage(0)
                }}
              >
                <option value="">Todos os clientes</option>
                {(clientes.data?.content ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_empresa}
                  </option>
                ))}
              </Select>
            )}
            <Select
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_APLICATIVO_MOBILE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
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
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="Nenhum aplicativo encontrado" />}
          />
        )}
      </DataTableShell>

      {isAdmin && (
      <Modal
        open={open}
        title={editing ? 'Editar aplicativo' : 'Novo aplicativo'}
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
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">Dados do aplicativo</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {isAdmin && (
                <Select
                  label="Cliente"
                  value={form.cliente_id}
                  error={errors.cliente_id}
                  onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {(clientes.data?.content ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome_empresa}
                    </option>
                  ))}
                </Select>
              )}
              <Input
                label="Nome"
                value={form.nome}
                error={errors.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as StatusAplicativoMobile }))
                }
              >
                {Object.entries(STATUS_APLICATIVO_MOBILE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Descrição"
                className="md:col-span-2"
                value={form.descricao}
                error={errors.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">Android</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Package ID"
                placeholder="br.net.convertix.app"
                value={form.package_android}
                error={errors.package_android}
                onChange={(e) => setForm((f) => ({ ...f, package_android: e.target.value }))}
              />
              <Input
                label="Versão"
                placeholder="1.0.0"
                value={form.versao_android}
                onChange={(e) => setForm((f) => ({ ...f, versao_android: e.target.value }))}
              />
              <Input
                label="Link da Google Play"
                className="md:col-span-2"
                placeholder="https://play.google.com/store/apps/details?id="
                value={form.url_android}
                error={errors.url_android}
                onChange={(e) => setForm((f) => ({ ...f, url_android: e.target.value }))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">iOS</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Bundle ID"
                placeholder="br.net.convertix.app"
                value={form.bundle_id_ios}
                error={errors.bundle_id_ios}
                onChange={(e) => setForm((f) => ({ ...f, bundle_id_ios: e.target.value }))}
              />
              <Input
                label="Versão"
                placeholder="1.0.0"
                value={form.versao_ios}
                onChange={(e) => setForm((f) => ({ ...f, versao_ios: e.target.value }))}
              />
              <Input
                label="Link da App Store"
                className="md:col-span-2"
                placeholder="https://apps.apple.com/"
                value={form.url_ios}
                error={errors.url_ios}
                onChange={(e) => setForm((f) => ({ ...f, url_ios: e.target.value }))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">Documentação</h3>
            <PdfPicker
              currentUrl={documentoAtual}
              file={form.documento}
              error={errors.documento}
              onInvalid={(message) => {
                setErrors((e) => ({ ...e, documento: message }))
                push(message, 'error')
              }}
              onChange={(file) => {
                setErrors((e) => ({ ...e, documento: '' }))
                setForm((f) => ({ ...f, documento: file, removerDocumento: false }))
              }}
              onRemoveCurrent={() =>
                setForm((f) => ({ ...f, documento: null, removerDocumento: true }))
              }
            />
          </section>
        </div>
      </Modal>
      )}

      <Modal
        open={Boolean(viewing)}
        title={viewing?.nome ?? 'Aplicativo'}
        wide
        onClose={() => setViewing(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Fechar
            </Button>
            {isAdmin && viewing && (
              <Button
                onClick={() => {
                  const current = viewing
                  setViewing(null)
                  openEdit(current)
                }}
              >
                Editar
              </Button>
            )}
          </div>
        }
      >
        {viewing && (
          <div className="space-y-6 text-sm">
            <section className="space-y-3">
              <h3 className="font-semibold text-ink">Informações gerais</h3>
              <dl className="grid gap-3 md:grid-cols-2">
                <Detail label="Nome" value={viewing.nome} />
                {isAdmin && <Detail label="Cliente" value={viewing.cliente_nome_empresa} />}
                <Detail label="Status" value={<StatusAplicativoMobileBadge status={viewing.status} />} />
                <Detail label="Atualizado" value={formatDateTime(viewing.updated_at)} />
                <Detail label="Descrição" value={viewing.descricao} className="md:col-span-2" />
              </dl>
            </section>
            <section className="space-y-3">
              <h3 className="font-semibold text-ink">Android</h3>
              <dl className="grid gap-3 md:grid-cols-2">
                <Detail label="Package ID" value={viewing.package_android} />
                <Detail label="Versão" value={viewing.versao_android} />
                <Detail
                  label="Google Play"
                  className="md:col-span-2"
                  value={
                    viewing.url_android ? (
                      <a
                        href={normalizeUrl(viewing.url_android)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-info hover:underline"
                      >
                        {viewing.url_android}
                      </a>
                    ) : null
                  }
                />
              </dl>
            </section>
            <section className="space-y-3">
              <h3 className="font-semibold text-ink">iOS</h3>
              <dl className="grid gap-3 md:grid-cols-2">
                <Detail label="Bundle ID" value={viewing.bundle_id_ios} />
                <Detail label="Versão" value={viewing.versao_ios} />
                <Detail
                  label="App Store"
                  className="md:col-span-2"
                  value={
                    viewing.url_ios ? (
                      <a
                        href={normalizeUrl(viewing.url_ios)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-info hover:underline"
                      >
                        {viewing.url_ios}
                      </a>
                    ) : null
                  }
                />
              </dl>
            </section>
            <section className="space-y-3">
              <h3 className="font-semibold text-ink">Documentação</h3>
              {viewing.documento_requisitos_url ? (
                <PdfPicker
                  currentUrl={viewing.documento_requisitos_url}
                  readOnly={!isAdmin}
                  disabled={uploadView.isPending || removeDocView.isPending}
                  onInvalid={(message) => push(message, 'error')}
                  onChange={(file) => isAdmin && file && uploadView.mutate(file)}
                  onRemoveCurrent={() => isAdmin && removeDocView.mutate()}
                />
              ) : isAdmin ? (
                <div className="space-y-3">
                  <p className="text-muted">Nenhum documento cadastrado</p>
                  <PdfPicker
                    disabled={uploadView.isPending}
                    onInvalid={(message) => push(message, 'error')}
                    onChange={(file) => file && uploadView.mutate(file)}
                  />
                </div>
              ) : (
                <p className="text-muted">Nenhum documento cadastrado</p>
              )}
            </section>
          </div>
        )}
      </Modal>

      {isAdmin && (
        <ConfirmDialog
          open={Boolean(removing)}
          title="Excluir aplicativo"
          message={`Deseja excluir ${removing?.nome}?`}
          confirmLabel="Excluir"
          danger
          loading={remove.isPending}
          onClose={() => setRemoving(null)}
          onConfirm={() => removing && remove.mutate(removing.id)}
        />
      )}
    </PageFill>
  )
}

function Detail({
  label,
  value,
  className,
}: {
  label: string
  value?: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{value || '—'}</dd>
    </div>
  )
}
