import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, Eye, Plus, RefreshCw } from 'lucide-react'
import {
  cancelarPagamento,
  criarPagamento,
  estornarPagamento,
  listarPagamentos,
  obterPagamento,
  sincronizarPagamento,
} from '@/lib/api/pagamentos'
import { listarClientes } from '@/lib/api/clientes'
import { ApiError } from '@/lib/api/client'
import { formatDate, formatDateTime, formatMoney, parseCurrency, todayIso } from '@/lib/format'
import { FORMA_PAGAMENTO_LABEL, STATUS_PAGAMENTO_LABEL, enumLabel } from '@/lib/labels'
import {
  FormaPagamento,
  StatusPagamento,
  isPagamentoPago,
  podeCancelarPagamento,
  podeEstornarPagamento,
} from '@/types/enums'
import type { Pagamento } from '@/types/models'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { CurrencyInput, Input, Select, Textarea } from '@/components/ui/Input'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { FormaBadge, StatusPagamentoBadge } from '@/components/status/badges'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'

function qrSrc(qr?: string | null) {
  if (!qr) return ''
  if (qr.startsWith('data:')) return qr
  return `data:image/png;base64,${qr.includes(',') ? qr.split(',').pop() : qr}`
}

export function PagamentosPage() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [forma, setForma] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [novoOpen, setNovoOpen] = useState(false)
  const [detalheId, setDetalheId] = useState<number | null>(null)
  const [pixOpen, setPixOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Pagamento | null>(null)
  const [estornoTarget, setEstornoTarget] = useState<Pagamento | null>(null)

  const [form, setForm] = useState({
    cliente_id: '',
    valor: '',
    descricao: '',
    data_vencimento: todayIso(),
    external_reference: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['pagamentos', status, forma, dataInicio, dataFim, page],
    queryFn: () =>
      listarPagamentos({
        status: (status || undefined) as StatusPagamento | undefined,
        forma_pagamento: (forma || undefined) as FormaPagamento | undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        page,
        size: 20,
      }),
  })

  const clientes = useQuery({
    queryKey: ['clientes-lookup'],
    queryFn: () => listarClientes({ page: 0, size: 100 }),
    enabled: isAdmin && novoOpen,
  })

  const detalhe = useQuery({
    queryKey: ['pagamento', detalheId],
    queryFn: () => obterPagamento(detalheId!),
    enabled: detalheId != null,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['pagamentos'] })
    queryClient.invalidateQueries({ queryKey: ['pagamentos-ultimos'] })
    queryClient.invalidateQueries({ queryKey: ['financeiro-dashboard'] })
    if (detalheId != null) queryClient.invalidateQueries({ queryKey: ['pagamento', detalheId] })
  }

  const criar = useMutation({
    mutationFn: () =>
      criarPagamento({
        cliente_id: form.cliente_id ? Number(form.cliente_id) : undefined,
        valor: parseCurrency(form.valor),
        descricao: form.descricao.trim(),
        data_vencimento: form.data_vencimento || undefined,
        external_reference: form.external_reference.trim() || undefined,
      }),
    onSuccess: (pag) => {
      push('Cobrança gerada. O cliente escolhe a forma ao pagar.', 'success')
      invalidateAll()
      setNovoOpen(false)
      setDetalheId(pag.id)
      if (pag.invoice_url) window.open(pag.invoice_url, '_blank', 'noopener,noreferrer')
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao criar cobrança.', 'error'),
  })

  const sync = useMutation({
    mutationFn: (id: number) => sincronizarPagamento(id),
    onSuccess: () => {
      push('Status sincronizado.', 'success')
      invalidateAll()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao sincronizar.', 'error'),
  })

  const cancelar = useMutation({
    mutationFn: (id: number) => cancelarPagamento(id),
    onSuccess: () => {
      push('Pagamento cancelado.', 'success')
      setCancelTarget(null)
      invalidateAll()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao cancelar.', 'error'),
  })

  const estornar = useMutation({
    mutationFn: (id: number) => estornarPagamento(id),
    onSuccess: () => {
      push('Estorno solicitado.', 'success')
      setEstornoTarget(null)
      invalidateAll()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao estornar.', 'error'),
  })

  useEffect(() => {
    if (!pixOpen || !detalhe.data?.id || isPagamentoPago(detalhe.data.status)) return
    const timer = window.setInterval(() => {
      sync.mutate(detalhe.data!.id)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [pixOpen, detalhe.data?.id, detalhe.data?.status])

  function openNovo() {
    setForm({
      cliente_id: '',
      valor: '',
      descricao: '',
      data_vencimento: todayIso(),
      external_reference: '',
    })
    setFormErrors({})
    setNovoOpen(true)
  }

  function validateNovo() {
    const next: Record<string, string> = {}
    if (isAdmin && !form.cliente_id) next.cliente_id = 'Selecione o cliente.'
    const valor = parseCurrency(form.valor)
    if (!Number.isFinite(valor) || valor < 5) next.valor = 'Valor mínimo de R$ 5,00.'
    if (!form.descricao.trim()) next.descricao = 'Informe a descrição.'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  async function copyPix(codigo?: string | null) {
    if (!codigo) return
    await navigator.clipboard.writeText(codigo)
    push('Código PIX copiado.', 'success')
  }

  const columns = useMemo<Column<Pagamento>[]>(
    () => [
      {
        key: 'desc',
        header: 'Cobrança',
        render: (row) => <p className="font-semibold">{row.descricao}</p>,
      },
      {
        key: 'cliente',
        header: 'Cliente',
        render: (row) => row.cliente_nome_empresa || '—',
      },
      {
        key: 'valor',
        header: 'Valor',
        render: (row) => <span className="font-semibold">{formatMoney(row.valor)}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusPagamentoBadge status={row.status} />,
      },
      {
        key: 'forma',
        header: 'Forma',
        render: (row) => <FormaBadge forma={row.forma_pagamento} />,
      },
      {
        key: 'venc',
        header: 'Vencimento',
        render: (row) => formatDate(row.data_vencimento),
      },
      {
        key: 'created',
        header: 'Criado',
        render: (row) => formatDateTime(row.created_at),
      },
      {
        key: 'acoes',
        header: '',
        className: 'text-right',
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            title="Detalhes"
            aria-label="Detalhes"
            icon={<Eye className="size-5" />}
            onClick={() => setDetalheId(row.id)}
          />
        ),
      },
    ],
    [],
  )

  const pagamento = detalhe.data

  return (
    <PageFill>
      <PageHeader
        eyebrow="Financeiro"
        title="Pagamentos e faturas"
        description="Gere cobranças, acompanhe status e gerencie PIX, cancelamentos e estornos."
        actions={
          isAdmin ? (
            <Button icon={<Plus className="size-4" />} onClick={openNovo}>
              Nova cobrança
            </Button>
          ) : undefined
        }
      />

      <DataTableShell
        toolbar={
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_PAGAMENTO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              label="Forma"
              value={forma}
              onChange={(e) => {
                setForma(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todas</option>
              {Object.entries(FORMA_PAGAMENTO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="De"
              type="date"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value)
                setPage(0)
              }}
            />
            <Input
              label="Até"
              type="date"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value)
                setPage(0)
              }}
            />
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
            empty={<EmptyState title="Nenhum pagamento encontrado" />}
          />
        )}
      </DataTableShell>

      <Modal
        open={novoOpen}
        title="Nova cobrança"
        description="O cliente escolhe a forma de pagamento no link do Asaas."
        onClose={() => setNovoOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button
              loading={criar.isPending}
              onClick={() => {
                if (!validateNovo()) return
                criar.mutate()
              }}
            >
              Gerar cobrança
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {isAdmin && (
            <Select
              label="Cliente"
              value={form.cliente_id}
              error={formErrors.cliente_id}
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
          <CurrencyInput
            label="Valor (mín. R$ 5,00)"
            placeholder="R$ 5,00"
            value={form.valor}
            error={formErrors.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
          />
          <Textarea
            label="Descrição"
            value={form.descricao}
            error={formErrors.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          />
          <Input
            label="Vencimento"
            type="date"
            value={form.data_vencimento}
            onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))}
          />
          <Input
            label="Referência externa"
            hint="Opcional"
            value={form.external_reference}
            onChange={(e) => setForm((f) => ({ ...f, external_reference: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={detalheId != null}
        title="Detalhe do pagamento"
        description={pagamento?.descricao}
        wide
        onClose={() => {
          setDetalheId(null)
          setPixOpen(false)
        }}
        footer={
          pagamento ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                icon={<RefreshCw className="size-4" />}
                loading={sync.isPending}
                onClick={() => sync.mutate(pagamento.id)}
              >
                Sincronizar
              </Button>
              {pagamento.invoice_url && (
                <Button
                  variant="secondary"
                  icon={<ExternalLink className="size-4" />}
                  onClick={() => window.open(pagamento.invoice_url!, '_blank', 'noopener,noreferrer')}
                >
                  Abrir fatura
                </Button>
              )}
              {pagamento.forma_pagamento === FormaPagamento.PIX &&
                (pagamento.qr_code || pagamento.codigo_pix) && (
                  <Button onClick={() => setPixOpen(true)}>Ver PIX</Button>
                )}
              {podeCancelarPagamento(pagamento.status) && (
                <Button variant="danger" onClick={() => setCancelTarget(pagamento)}>
                  Cancelar
                </Button>
              )}
              {podeEstornarPagamento(pagamento.status) && (
                <Button variant="danger" onClick={() => setEstornoTarget(pagamento)}>
                  Estornar
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {detalhe.isLoading || !pagamento ? (
          <PageSpinner />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Valor" value={formatMoney(pagamento.valor)} />
            <Info label="Status" value={<StatusPagamentoBadge status={pagamento.status} />} />
            <Info label="Forma" value={enumLabel(FORMA_PAGAMENTO_LABEL, pagamento.forma_pagamento)} />
            <Info label="Cliente" value={pagamento.cliente_nome_empresa || '—'} />
            <Info label="Site" value={pagamento.site_nome || '—'} />
            <Info label="Vencimento" value={formatDate(pagamento.data_vencimento)} />
            <Info label="Confirmado em" value={formatDateTime(pagamento.data_confirmacao)} />
            <Info label="Criado em" value={formatDateTime(pagamento.created_at)} />
            <Info label="Asaas ID" value={pagamento.asaas_payment_id || '—'} />
            <Info label="Referência" value={pagamento.external_reference || '—'} />
            {pagamento.mensagem_asaas && (
              <div className="md:col-span-2 rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
                {pagamento.mensagem_asaas}
              </div>
            )}
            {(pagamento.historico_status?.length ?? 0) > 0 && (
              <div className="md:col-span-2">
                <h4 className="mb-2 font-medium">Histórico</h4>
                <div className="space-y-2">
                  {pagamento.historico_status!.map((h) => (
                    <div key={h.id} className="rounded-2xl bg-paper px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPagamentoBadge status={h.status_anterior} />
                        <span className="text-muted">→</span>
                        <StatusPagamentoBadge status={h.status_novo} />
                        <span className="text-xs text-muted">{formatDateTime(h.created_at)}</span>
                      </div>
                      {h.mensagem && <p className="mt-1 text-muted">{h.mensagem}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={pixOpen && !!pagamento}
        title={isPagamentoPago(pagamento?.status) ? 'Pagamento confirmado' : 'Pagamento PIX'}
        description={pagamento?.descricao}
        onClose={() => setPixOpen(false)}
      >
        {pagamento && (
          <div className="space-y-4 text-center">
            <StatusPagamentoBadge status={pagamento.status} />
            <p className="font-display text-3xl">{formatMoney(pagamento.valor)}</p>
            {qrSrc(pagamento.qr_code) && (
              <img
                src={qrSrc(pagamento.qr_code)}
                alt="QR Code PIX"
                className="mx-auto size-56 rounded-2xl border border-line bg-white p-3"
              />
            )}
            {pagamento.codigo_pix && (
              <div className="rounded-2xl bg-paper p-4 text-left">
                <p className="mb-2 text-xs tracking-wide text-muted uppercase">Código copia e cola</p>
                <p className="break-all font-mono text-xs">{pagamento.codigo_pix}</p>
                <Button
                  className="mt-3"
                  variant="secondary"
                  icon={<Copy className="size-4" />}
                  onClick={() => copyPix(pagamento.codigo_pix)}
                >
                  Copiar código
                </Button>
              </div>
            )}
            {!isPagamentoPago(pagamento.status) && (
              <p className="text-sm text-muted">Atualizando status automaticamente a cada 7 segundos…</p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar pagamento?"
        message="Esta ação cancela a cobrança pendente no Asaas."
        confirmLabel="Cancelar cobrança"
        danger
        loading={cancelar.isPending}
        onConfirm={() => cancelTarget && cancelar.mutate(cancelTarget.id)}
        onClose={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={!!estornoTarget}
        title="Estornar pagamento?"
        message="O valor pago será estornado junto ao Asaas."
        confirmLabel="Estornar"
        danger
        loading={estornar.isPending}
        onConfirm={() => estornoTarget && estornar.mutate(estornoTarget.id)}
        onClose={() => setEstornoTarget(null)}
      />
    </PageFill>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  )
}
