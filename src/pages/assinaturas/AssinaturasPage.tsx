import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Plus } from 'lucide-react'
import {
  cancelarAssinatura,
  criarAssinatura,
  listarAssinaturas,
  obterAssinatura,
} from '@/lib/api/assinaturas'
import { listarClientes } from '@/lib/api/clientes'
import { listarSites } from '@/lib/api/sites'
import { listarAplicativosMobile } from '@/lib/api/aplicativosMobile'
import { ApiError } from '@/lib/api/client'
import { formatCurrencyInput, formatDate, formatDateTime, formatMoney, parseCurrency, plusDaysIso } from '@/lib/format'
import { CICLO_LABEL, STATUS_ASSINATURA_LABEL, TIPO_SITE_LABEL, enumLabel } from '@/lib/labels'
import {
  CicloAssinatura,
  PLANOS_ASSINATURA,
  StatusAssinatura,
  TipoSite,
} from '@/types/enums'
import type { AplicativoMobile, Assinatura, Site } from '@/types/models'
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
import { CicloBadge, StatusAssinaturaBadge, StatusPagamentoBadge } from '@/components/status/badges'
import { cn } from '@/lib/cn'
import { DataTableShell, PageFill } from '@/components/ui/PageFrame'

type PlanoId = (typeof PLANOS_ASSINATURA)[number]['id']

export function AssinaturasPage() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [novoOpen, setNovoOpen] = useState(false)
  const [detalheId, setDetalheId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Assinatura | null>(null)

  const [clienteId, setClienteId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [aplicativoId, setAplicativoId] = useState('')
  const [planoId, setPlanoId] = useState<PlanoId>('biolink')
  const [valor, setValor] = useState(formatCurrencyInput(30))
  const [descricao, setDescricao] = useState<string>(PLANOS_ASSINATURA[0].descricaoPadrao)
  const [proxima, setProxima] = useState(plusDaysIso(30))
  const [referencia, setReferencia] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const list = useQuery({
    queryKey: ['assinaturas', status, page],
    queryFn: () =>
      listarAssinaturas({
        status: (status || undefined) as StatusAssinatura | undefined,
        page,
        size: 20,
      }),
  })

  const clientes = useQuery({
    queryKey: ['clientes-lookup'],
    queryFn: () => listarClientes({ page: 0, size: 100 }),
    enabled: isAdmin && novoOpen,
  })

  const sites = useQuery({
    queryKey: ['sites-lookup'],
    queryFn: () => listarSites({ page: 0, size: 100 }),
    enabled: isAdmin && novoOpen,
  })
  const aplicativos = useQuery({
    queryKey: ['aplicativos-mobile-lookup'],
    queryFn: () => listarAplicativosMobile({ page: 0, size: 100 }),
    enabled: isAdmin && novoOpen,
  })

  const ativasLookup = useQuery({
    queryKey: ['assinaturas-ativas-lookup'],
    queryFn: () => listarAssinaturas({ status: StatusAssinatura.ACTIVE, page: 0, size: 100 }),
    enabled: isAdmin && novoOpen,
  })

  const detalhe = useQuery({
    queryKey: ['assinatura', detalheId],
    queryFn: () => obterAssinatura(detalheId!),
    enabled: detalheId != null,
  })

  const sitesOcupados = useMemo(() => {
    const set = new Set<number>()
    for (const a of ativasLookup.data?.content ?? []) {
      if (a.site_id != null) set.add(a.site_id)
    }
    return set
  }, [ativasLookup.data])

  const aplicativosOcupados = useMemo(() => {
    const set = new Set<number>()
    for (const a of ativasLookup.data?.content ?? []) {
      if (a.aplicativo_mobile_id != null) set.add(a.aplicativo_mobile_id)
    }
    return set
  }, [ativasLookup.data])

  const sitesDisponiveis = useMemo(() => {
    if (!clienteId) return [] as Site[]
    return (sites.data?.content ?? []).filter(
      (s) => s.cliente_id === Number(clienteId) && !sitesOcupados.has(s.id),
    )
  }, [sites.data, clienteId, sitesOcupados])

  const aplicativosDisponiveis = useMemo(() => {
    if (!clienteId) return [] as AplicativoMobile[]
    return (aplicativos.data?.content ?? []).filter(
      (app) => app.cliente_id === Number(clienteId) && !aplicativosOcupados.has(app.id),
    )
  }, [aplicativos.data, clienteId, aplicativosOcupados])

  const plano = PLANOS_ASSINATURA.find((p) => p.id === planoId) ?? PLANOS_ASSINATURA[0]

  function aplicarPlano(id: PlanoId, siteTipo?: TipoSite | null) {
    const next =
      PLANOS_ASSINATURA.find((p) => p.id === id) ??
      PLANOS_ASSINATURA.find((p) => p.tipoSite === siteTipo) ??
      PLANOS_ASSINATURA[0]
    setPlanoId(next.id)
    if (next.recurso === 'aplicativo') {
      setSiteId('')
    } else {
      setAplicativoId('')
    }
    if (!next.manual && next.valorFixo != null) {
      setValor(formatCurrencyInput(next.valorFixo))
      setDescricao(next.descricaoPadrao)
    } else if (next.manual) {
      setValor('')
      setDescricao('')
    }
  }

  function onSiteChange(id: string) {
    setSiteId(id)
    const site = sitesDisponiveis.find((s) => s.id === Number(id))
    if (site) aplicarPlano(site.tipo === TipoSite.BIOLINK ? 'biolink' : site.tipo === TipoSite.LANDING_PAGE ? 'landing_page' : site.tipo === TipoSite.SITE_COMERCIAL ? 'site_institucional' : 'outro', site.tipo)
  }

  function onAplicativoChange(id: string) {
    setAplicativoId(id)
    const app = aplicativosDisponiveis.find((item) => item.id === Number(id))
    if (app) {
      setDescricao(`Assinatura mensal ${app.nome}`)
    }
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['assinaturas'] })
    queryClient.invalidateQueries({ queryKey: ['financeiro-dashboard'] })
    if (detalheId != null) queryClient.invalidateQueries({ queryKey: ['assinatura', detalheId] })
  }

  const criar = useMutation({
    mutationFn: () => {
      const valorFinal = plano.manual ? parseCurrency(valor) : Number(plano.valorFixo)
      const paraAplicativo = plano.recurso === 'aplicativo'
      return criarAssinatura({
        cliente_id: Number(clienteId),
        site_id: paraAplicativo ? undefined : Number(siteId),
        aplicativo_mobile_id: paraAplicativo ? Number(aplicativoId) : undefined,
        valor: valorFinal,
        descricao: descricao.trim() || plano.descricaoPadrao,
        ciclo: CicloAssinatura.MONTHLY,
        proxima_cobranca: proxima,
        external_reference: referencia.trim() || undefined,
      })
    },
    onSuccess: () => {
      push('Assinatura criada com sucesso.', 'success')
      setNovoOpen(false)
      invalidateAll()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao criar assinatura.', 'error'),
  })

  const cancelar = useMutation({
    mutationFn: (id: number) => cancelarAssinatura(id),
    onSuccess: () => {
      push('Assinatura cancelada.', 'success')
      setCancelTarget(null)
      setDetalheId(null)
      invalidateAll()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao cancelar.', 'error'),
  })

  function openNovo() {
    setClienteId('')
    setSiteId('')
    setAplicativoId('')
    aplicarPlano('biolink')
    setProxima(plusDaysIso(30))
    setReferencia('')
    setErrors({})
    setNovoOpen(true)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!clienteId) next.cliente_id = 'Selecione o cliente.'
    if (plano.recurso === 'aplicativo') {
      if (!aplicativoId) next.aplicativo_id = 'Selecione um aplicativo sem assinatura ativa.'
    } else if (!siteId) {
      next.site_id = 'Selecione um site sem assinatura ativa.'
    }
    if (!proxima) next.proxima = 'Informe a próxima cobrança.'
    if (plano.manual) {
      const v = parseCurrency(valor)
      if (!Number.isFinite(v) || v <= 0) next.valor = 'Informe um valor válido.'
      if (!descricao.trim()) next.descricao = 'Informe a descrição.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const columns = useMemo<Column<Assinatura>[]>(
    () => [
      {
        key: 'desc',
        header: 'Assinatura',
        render: (row) => <p className="font-semibold">{row.descricao}</p>,
      },
      {
        key: 'cliente',
        header: 'Cliente',
        render: (row) => row.cliente_nome_empresa || '—',
      },
      {
        key: 'site',
        header: 'Site',
        render: (row) => row.site_nome || '—',
      },
      {
        key: 'aplicativo',
        header: 'Aplicativo',
        render: (row) => row.aplicativo_mobile_nome || '—',
      },
      {
        key: 'valor',
        header: 'Valor',
        render: (row) => <span className="font-semibold">{formatMoney(row.valor)}</span>,
      },
      {
        key: 'ciclo',
        header: 'Ciclo',
        render: (row) => <CicloBadge ciclo={row.ciclo} />,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusAssinaturaBadge status={row.status} />,
      },
      {
        key: 'proxima',
        header: 'Próxima',
        render: (row) => formatDate(row.proxima_cobranca),
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

  const assinatura = detalhe.data

  return (
    <PageFill>
      <PageHeader
        eyebrow="Financeiro"
        title="Assinaturas"
        description="Planos recorrentes vinculados aos sites e aplicativos dos clientes."
        actions={
          isAdmin ? (
            <Button icon={<Plus className="size-4" />} onClick={openNovo}>
              Nova assinatura
            </Button>
          ) : undefined
        }
      />

      <DataTableShell
        toolbar={
          <div className="max-w-xs">
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_ASSINATURA_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
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
            empty={<EmptyState title="Nenhuma assinatura encontrada" />}
          />
        )}
      </DataTableShell>

      <Modal
        open={novoOpen}
        title="Nova assinatura"
        description="O cliente escolhe o método de pagamento em cada cobrança."
        wide
        onClose={() => setNovoOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button
              loading={criar.isPending}
              onClick={() => {
                if (!validate()) return
                criar.mutate()
              }}
            >
              Criar assinatura
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Cliente"
              value={clienteId}
              error={errors.cliente_id}
              onChange={(e) => {
                setClienteId(e.target.value)
                setSiteId('')
                setAplicativoId('')
              }}
            >
              <option value="">Selecione</option>
              {(clientes.data?.content ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_empresa}
                </option>
              ))}
            </Select>
            {plano.recurso === 'aplicativo' ? (
              <Select
                label="Aplicativo"
                value={aplicativoId}
                error={errors.aplicativo_id}
                disabled={!clienteId}
                onChange={(e) => onAplicativoChange(e.target.value)}
              >
                <option value="">
                  {!clienteId
                    ? 'Selecione o cliente'
                    : aplicativosDisponiveis.length === 0
                      ? 'Nenhum aplicativo disponível'
                      : 'Selecione'}
                </option>
                {aplicativosDisponiveis.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.nome}
                  </option>
                ))}
              </Select>
            ) : (
              <Select
                label="Site"
                value={siteId}
                error={errors.site_id}
                disabled={!clienteId}
                onChange={(e) => onSiteChange(e.target.value)}
              >
                <option value="">
                  {!clienteId
                    ? 'Selecione o cliente'
                    : sitesDisponiveis.length === 0
                      ? 'Nenhum site disponível'
                      : 'Selecione'}
                </option>
                {sitesDisponiveis.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} · {enumLabel(TIPO_SITE_LABEL, s.tipo)}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Plano</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PLANOS_ASSINATURA.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => aplicarPlano(p.id)}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-left transition',
                    planoId === p.id
                      ? 'border-brand bg-brand-soft'
                      : 'border-line bg-paper hover:border-ink/20',
                  )}
                >
                  <p className="font-semibold">{p.titulo}</p>
                  <p className="mt-1 text-xs text-muted">
                    {p.manual ? 'Valor personalizado' : formatMoney(p.valorFixo)}
                    {!p.manual && ` · ${CICLO_LABEL.MONTHLY}`}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CurrencyInput
              label="Valor"
              value={valor}
              disabled={!plano.manual}
              error={errors.valor}
              onChange={(e) => setValor(e.target.value)}
            />
            <Input
              label="Próxima cobrança"
              type="date"
              value={proxima}
              error={errors.proxima}
              onChange={(e) => setProxima(e.target.value)}
            />
          </div>
          <Textarea
            label="Descrição"
            value={descricao}
            disabled={!plano.manual}
            error={errors.descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <Input
            label="Referência externa"
            hint="Opcional"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={detalheId != null}
        title="Detalhe da assinatura"
        description={assinatura?.descricao}
        wide
        onClose={() => setDetalheId(null)}
        footer={
          assinatura?.status === StatusAssinatura.ACTIVE && isAdmin ? (
            <div className="flex justify-end">
              <Button variant="danger" onClick={() => setCancelTarget(assinatura)}>
                Cancelar assinatura
              </Button>
            </div>
          ) : undefined
        }
      >
        {detalhe.isLoading || !assinatura ? (
          <PageSpinner />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Valor" value={formatMoney(assinatura.valor)} />
              <Info label="Status" value={<StatusAssinaturaBadge status={assinatura.status} />} />
              <Info label="Ciclo" value={enumLabel(CICLO_LABEL, assinatura.ciclo)} />
              <Info label="Próxima cobrança" value={formatDate(assinatura.proxima_cobranca)} />
              <Info label="Cliente" value={assinatura.cliente_nome_empresa || '—'} />
              <Info label="Site" value={assinatura.site_nome || '—'} />
              <Info label="Aplicativo" value={assinatura.aplicativo_mobile_nome || '—'} />
              <Info label="Asaas ID" value={assinatura.asaas_subscription_id || '—'} />
              <Info label="Criada em" value={formatDateTime(assinatura.created_at)} />
            </div>

            <div>
              <h4 className="mb-2 font-medium">Cobranças</h4>
              {(assinatura.cobrancas?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted">Nenhuma cobrança vinculada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {assinatura.cobrancas!.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">{c.descricao}</p>
                        <p className="text-xs text-muted">{formatDateTime(c.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatMoney(c.valor)}</p>
                        <StatusPagamentoBadge status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar assinatura?"
        message="A assinatura será encerrada e novas cobranças deixarão de ser geradas."
        confirmLabel="Cancelar assinatura"
        danger
        loading={cancelar.isPending}
        onConfirm={() => cancelTarget && cancelar.mutate(cancelTarget.id)}
        onClose={() => setCancelTarget(null)}
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
