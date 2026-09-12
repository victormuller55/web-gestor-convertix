import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { alterarPlano, apagarPlano, criarPlano, listarPlanos, type PlanoPayload } from '@/lib/api/planos'
import { ApiError } from '@/lib/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCurrencyInput, formatMoney, parseCurrency } from '@/lib/format'
import { CICLO_LABEL, TIPO_PROJETO_LABEL, VINCULO_PLANO_LABEL } from '@/lib/labels'
import { CicloAssinatura, TipoProjeto, VinculoPlano } from '@/types/enums'
import type { Plano } from '@/types/models'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CurrencyInput, Input, Select, Textarea } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/Select'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Switch } from '@/components/ui/Switch'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'
import { CicloBadge, TipoProjetoBadge, VinculoPlanoBadge } from '@/components/status/badges'
import { cn } from '@/lib/cn'

interface FormState {
  nome: string
  tipo: TipoProjeto
  vinculo: VinculoPlano
  valor: string
  valor_livre: boolean
  ciclo: CicloAssinatura
  descricao_padrao: string
  ativo: boolean
  ordem: string
}

const emptyForm: FormState = {
  nome: '',
  tipo: TipoProjeto.BIOLINK,
  vinculo: VinculoPlano.SITE,
  valor: formatCurrencyInput(30),
  valor_livre: false,
  ciclo: CicloAssinatura.MONTHLY,
  descricao_padrao: '',
  ativo: true,
  ordem: '0',
}

export function PlanosPage() {
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('true')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Plano | null>(null)
  const [removing, setRemoving] = useState<Plano | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const search = useDebouncedValue(query)

  const list = useQuery({
    queryKey: ['planos', search, page, filtroTipo, filtroAtivo],
    queryFn: () =>
      listarPlanos({
        query: search,
        page,
        size: 30,
        tipo: filtroTipo ? (filtroTipo as TipoProjeto) : undefined,
        ativo: filtroAtivo === '' ? undefined : filtroAtivo === 'true',
      }),
  })

  const save = useMutation({
    mutationFn: () => {
      const dados: PlanoPayload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        vinculo: form.vinculo,
        valor_livre: form.valor_livre,
        valor: form.valor_livre ? undefined : parseCurrency(form.valor),
        ciclo: form.ciclo,
        descricao_padrao: form.descricao_padrao.trim() || undefined,
        ativo: form.ativo,
        ordem: Number(form.ordem) || 0,
      }
      return editing ? alterarPlano(editing.id, dados) : criarPlano(dados)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos'] })
      queryClient.invalidateQueries({ queryKey: ['planos-ativos'] })
      setOpen(false)
      push(editing ? 'Plano atualizado.' : 'Plano criado.', 'success')
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarPlano(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos'] })
      queryClient.invalidateQueries({ queryKey: ['planos-ativos'] })
      setRemoving(null)
      push('Plano excluído.', 'success')
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setOpen(true)
  }

  function openEdit(plano: Plano) {
    setEditing(plano)
    setForm({
      nome: plano.nome,
      tipo: plano.tipo,
      vinculo: plano.vinculo,
      valor: plano.valor != null ? formatCurrencyInput(plano.valor) : '',
      valor_livre: plano.valor_livre,
      ciclo: plano.ciclo,
      descricao_padrao: plano.descricao_padrao ?? '',
      ativo: plano.ativo,
      ordem: String(plano.ordem ?? 0),
    })
    setErrors({})
    setOpen(true)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.nome.trim()) next.nome = 'Informe o nome.'
    if (!form.valor_livre) {
      const valor = parseCurrency(form.valor)
      if (!Number.isFinite(valor) || valor <= 0) next.valor = 'Informe um valor válido.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const columns = useMemo<Column<Plano>[]>(
    () => [
      {
        key: 'nome',
        header: 'Plano',
        render: (row) => (
          <div>
            <p className="font-semibold">{row.nome}</p>
            {row.codigo ? <p className="text-xs text-muted">{row.codigo}</p> : null}
          </div>
        ),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        render: (row) => <TipoProjetoBadge tipo={row.tipo} />,
      },
      {
        key: 'vinculo',
        header: 'Vínculo',
        render: (row) => <VinculoPlanoBadge vinculo={row.vinculo} />,
      },
      {
        key: 'valor',
        header: 'Valor',
        render: (row) =>
          row.valor_livre ? (
            <span className="text-muted">Livre</span>
          ) : (
            <span className="font-semibold">{formatMoney(row.valor)}</span>
          ),
      },
      {
        key: 'ciclo',
        header: 'Ciclo',
        render: (row) => <CicloBadge ciclo={row.ciclo} />,
      },
      {
        key: 'ativo',
        header: 'Status',
        render: (row) => (
          <Badge tone={row.ativo ? 'success' : 'neutral'}>{row.ativo ? 'Ativo' : 'Inativo'}</Badge>
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
        eyebrow="Financeiro"
        title="Planos"
        description="Catálogo de preços usado na criação de assinaturas. Mudar um valor não altera quem já assina."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            Novo plano
          </Button>
        }
      />

      <DataTableShell
        toolbar={
          <div className="grid gap-2 md:grid-cols-3">
            <SearchInput
              placeholder="Buscar por nome ou descrição"
              value={query}
              onChange={(next) => {
                setQuery(next)
                setPage(0)
              }}
            />
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
              label="Status"
              value={filtroAtivo}
              onChange={(e) => {
                setFiltroAtivo(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
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
            empty={<EmptyState title="Nenhum plano encontrado" />}
          />
        )}
      </DataTableShell>

      <Modal
        open={open}
        title={editing ? 'Editar plano' : 'Novo plano'}
        description="Mudar o catálogo não altera quem já assina."
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
        <div className="space-y-5">
          <Input
            label="Nome"
            value={form.nome}
            error={errors.nome}
            onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
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
              label="Vínculo"
              value={form.vinculo}
              onChange={(e) => setForm((current) => ({ ...current, vinculo: e.target.value as VinculoPlano }))}
            >
              {Object.entries(VINCULO_PLANO_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              label="Ciclo"
              value={form.ciclo}
              onChange={(e) => setForm((current) => ({ ...current, ciclo: e.target.value as CicloAssinatura }))}
            >
              {Object.entries(CICLO_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Ordem na lista"
              value={form.ordem}
              onChange={(e) => setForm((current) => ({ ...current, ordem: e.target.value.replace(/\D/g, '') }))}
            />
          </div>

          <div className="rounded-2xl border border-line bg-paper/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
              <CurrencyInput
                label="Valor"
                value={form.valor}
                error={errors.valor}
                hint={form.valor_livre ? 'Informado na hora de assinar.' : undefined}
                disabled={form.valor_livre}
                onChange={(e) => setForm((current) => ({ ...current, valor: e.target.value }))}
              />
              <Switch
                className="w-full"
                checked={form.valor_livre}
                onChange={(valor_livre) =>
                  setForm((current) => ({
                    ...current,
                    valor_livre,
                    valor: valor_livre ? '' : current.valor || formatCurrencyInput(30),
                  }))
                }
                label="Valor livre"
                description="O preço só é pedido na hora de assinar."
              />
            </div>
          </div>

          <div
            className={cn(
              'rounded-2xl border px-4 py-3',
              form.ativo ? 'border-brand/30 bg-brand-soft/40' : 'border-line bg-paper/50',
            )}
          >
            <Switch
              className="w-full"
              checked={form.ativo}
              onChange={(ativo) => setForm((current) => ({ ...current, ativo }))}
              label="Plano ativo"
              description="Inativo some da criação de assinaturas."
            />
          </div>

          <Textarea
            label="Descrição padrão"
            hint="Pré-preenche a descrição da assinatura."
            rows={2}
            value={form.descricao_padrao}
            onChange={(e) => setForm((current) => ({ ...current, descricao_padrao: e.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir plano"
        message={`Deseja excluir ${removing?.nome}? Planos com assinatura não podem ser apagados — desative-os.`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </PageFill>
  )
}
