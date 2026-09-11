import { useState, type CSSProperties, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  Building2,
  CreditCard,
  LayoutTemplate,
  Link2,
  Smartphone,
} from 'lucide-react'
import { obterDashboardInicio } from '@/lib/api/dashboard'
import { formatDateTime, formatMoney, formatPercent } from '@/lib/format'
import { TIPO_PRODUTO_DASHBOARD_LABEL } from '@/lib/labels'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusPagamentoBadge } from '@/components/status/badges'
import { PageFill, PageScroll } from '@/components/ui/PageFrame'
import { Table } from '@/components/ui/Table'
import { Select } from '@/components/ui/Input'
import { TipoProdutoDashboard } from '@/types/enums'
import type {
  ContagemValor,
  DashboardProdutoBloco,
  PontoQuantidadeMensal,
  PontoReceitaMensal,
} from '@/types/dashboard'

const COLORS = ['#00c44a', '#0b1f14', '#d97706', '#0284c7', '#64748b', '#e11d48']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const FILTROS_PRODUTO = Object.values(TipoProdutoDashboard)

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [tipoProduto, setTipoProduto] = useState<string>(TipoProdutoDashboard.TODOS)
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-inicio', tipoProduto],
    queryFn: () =>
      obterDashboardInicio({
        meses: 12,
        tipo_produto: tipoProduto,
        limite_atividades: 8,
        limite_alertas: 8,
        limite_tops: 5,
      }),
    enabled: isAdmin,
  })

  if (!isAdmin) return <Navigate to="/biolink" replace />

  if (isLoading && !data) {
    return (
      <PageFill>
        <PageSpinner />
      </PageFill>
    )
  }
  if (error || !data) {
    return (
      <PageFill>
        <EmptyState title="Não foi possível carregar o painel" description="Tente novamente em instantes." />
      </PageFill>
    )
  }

  const financeiro = data.financeiro
  const produtos = data.produtos
  const receita = (financeiro?.receita_mensal ?? []).map(comLabelMes)
  const receitaPorProduto = financeiro?.receita_por_produto ?? []
  const pagamentosStatus = (financeiro?.pagamentos_por_status ?? []).map((item) => ({
    ...item,
    nome: item.label ?? item.chave,
  }))
  const filtroLabel = financeiro?.tipo_produto_label ?? TIPO_PRODUTO_DASHBOARD_LABEL[tipoProduto as TipoProdutoDashboard]

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Visão da operação"
        title="O que está acontecendo agora"
        description="Financeiro com filtro por produto, além de cadastros de aplicativos, BioLinks, landing pages e sites institucionais."
      />

      <SectionCard
        title="Financeiro"
        description={`Números de cobrança${tipoProduto === TipoProdutoDashboard.TODOS ? ' de todos os produtos' : ` só de ${filtroLabel}`}.`}
        action={
          <Select
            label="Tipo de produto"
            className="w-full sm:w-64"
            value={tipoProduto}
            onChange={(event) => setTipoProduto(event.target.value)}
          >
            {FILTROS_PRODUTO.map((chave) => (
              <option key={chave} value={chave}>
                {TIPO_PRODUTO_DASHBOARD_LABEL[chave]}
              </option>
            ))}
          </Select>
        }
      >
        <div key={tipoProduto}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashKpi
            delay={0}
            label="Receita do mês"
            value={formatMoney(financeiro?.receita_mes_atual)}
            hint={`MRR ${formatMoney(financeiro?.mrr_estimado)} · vs mês anterior ${sinalPercentual(financeiro?.variacao_receita_percentual)}`}
            icon={<CreditCard className="size-4" />}
            tone="brand"
          />
          <DashKpi
            delay={1}
            label="Em aberto"
            value={formatMoney(financeiro?.total_pendente)}
            hint={`${financeiro?.quantidade_pendentes ?? 0} pendentes · ${financeiro?.quantidade_vencidos ?? 0} vencidos`}
            tone="warn"
          />
          <DashKpi
            delay={2}
            label="Assinaturas ativas"
            value={financeiro?.assinaturas_ativas ?? 0}
            hint={`Ticket médio ${formatMoney(financeiro?.ticket_medio_pago)}`}
          />
          <DashKpi
            delay={3}
            label="Total pago"
            value={formatMoney(financeiro?.total_pago)}
            hint={`${financeiro?.quantidade_pagamentos ?? 0} cobranças no filtro`}
          />
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <ChartCard delay={4} title="Receita mensal" hint="Valores pagos e em aberto no período">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={receita}>
                <CartesianGrid stroke="#e4e8df" vertical={false} />
                <XAxis dataKey="label_curto" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompact(Number(v))} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type="monotone" dataKey="valor_pago" stroke="#00c44a" fill="#00c44a33" name="Pago" />
                <Area type="monotone" dataKey="valor_pendente" stroke="#c47a00" fill="#c47a0022" name="Pendente" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            delay={5}
            title="Receita por tipo"
            hint="Visão geral do que já foi pago, sem o filtro"
            footer={
              receitaPorProduto.some((item) => Number(item.valor) > 0) ? (
                <LegendList
                  items={receitaPorProduto.map((item, index) => ({
                    chave: item.chave,
                    label: `${item.label ?? item.chave}: ${formatMoney(item.valor)}`,
                    color: COLORS[index % COLORS.length],
                  }))}
                />
              ) : null
            }
          >
            {receitaPorProduto.some((item) => Number(item.valor) > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={receitaPorProduto}
                    dataKey="valor"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={90}
                  >
                    {receitaPorProduto.map((entry, index) => (
                      <Cell key={entry.chave} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const qtd = Number((item?.payload as ContagemValor | undefined)?.quantidade ?? 0)
                      return [`${formatMoney(Number(value))} · ${qtd} pagto(s)`, 'Pago']
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </ChartCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard delay={6} title="Pagamentos por status" hint="Quantidade e valor no filtro atual" height="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pagamentosStatus}>
                <CartesianGrid stroke="#e4e8df" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value, _name, item) => {
                    const valor = Number((item?.payload as ContagemValor | undefined)?.valor ?? 0)
                    return [`${value} cobr. · ${formatMoney(valor)}`, 'Status']
                  }}
                />
                <Bar dataKey="quantidade" fill="#0f1c14" radius={[8, 8, 0, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {data.funil ? (
            <div
              className="card-enter rounded-2xl border border-line bg-card p-5"
              style={{ '--card-delay': `${7 * 55}ms` } as CSSProperties}
            >
              <h3 className="font-display text-lg">Funil de conversão</h3>
              <p className="mb-4 text-xs text-muted">Clientes da operação, independente do filtro de produto.</p>
              <div className="space-y-3">
                <FunilRow label="Clientes" value={data.funil.clientes ?? 0} />
                <FunilRow
                  label="Com site"
                  value={data.funil.clientes_com_site ?? 0}
                  hint={formatPercent(data.funil.taxas?.cliente_para_site ?? 0)}
                />
                <FunilRow
                  label="Com assinatura"
                  value={data.funil.clientes_com_assinatura ?? 0}
                  hint={formatPercent(data.funil.taxas?.site_para_assinatura ?? 0)}
                />
                <FunilRow
                  label="Com pagamento"
                  value={data.funil.clientes_com_pagamento_pago ?? 0}
                  hint={formatPercent(data.funil.taxas?.cliente_para_pago ?? 0)}
                />
              </div>
            </div>
          ) : null}
        </div>
        </div>
      </SectionCard>

      <ProdutoSection
        icon={<Smartphone className="size-5" />}
        bloco={produtos?.aplicativos}
        onOpen={() => navigate('/aplicativos-mobile')}
      />
      <ProdutoSection
        icon={<Link2 className="size-5" />}
        bloco={produtos?.biolinks}
        onOpen={() => navigate('/biolinks')}
      />
      <ProdutoSection
        icon={<LayoutTemplate className="size-5" />}
        bloco={produtos?.landing_pages}
        onOpen={() => navigate('/sites')}
      />
      <ProdutoSection
        icon={<Building2 className="size-5" />}
        bloco={produtos?.sites_institucionais}
        onOpen={() => navigate('/sites')}
      />

      <div className="grid xl:grid-cols-2">
        <section className="border-t border-line p-6 xl:border-r">
          <h3 className="mb-4 flex items-center gap-2 font-display text-xl">
            <AlertTriangle className="size-5 text-warn" />
            Alertas
          </h3>
          <div className="space-y-3">
            {(data.alertas ?? []).length === 0 && <p className="text-sm text-muted">Nada urgente agora.</p>}
            {(data.alertas ?? []).map((alerta) => (
              <button
                key={alerta.id}
                type="button"
                onClick={() => {
                  if (alerta.entidade === 'PAGAMENTO') navigate('/pagamentos')
                  if (alerta.entidade === 'SITE') navigate('/sites')
                  if (alerta.entidade === 'ASSINATURA') navigate('/assinaturas')
                }}
                className="block w-full border border-line px-4 py-3 text-left"
              >
                <p className="text-sm font-semibold">{alerta.titulo}</p>
                <p className="mt-1 text-xs text-muted">{alerta.mensagem}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden border-t border-line p-6">
          <h3 className="font-display text-xl">Últimos pagamentos</h3>
          <p className="mb-4 text-xs text-muted">Cobranças do filtro financeiro atual.</p>
          <Table
            rowKey={(pag) => pag.id}
            empty={<p className="text-sm text-muted">Nenhum pagamento neste filtro.</p>}
            rows={financeiro?.ultimos_pagamentos ?? []}
            columns={[
              {
                key: 'produto',
                header: 'Produto',
                render: (pag) => (
                  <div>
                    <p className="font-semibold">{pag.produto_nome || pag.descricao}</p>
                    <p className="text-xs text-muted">{pag.produto_tipo_label || 'Sem tipo'}</p>
                  </div>
                ),
              },
              {
                key: 'cliente',
                header: 'Cliente',
                render: (pag) => pag.cliente_nome ?? '—',
              },
              {
                key: 'created',
                header: 'Criado',
                render: (pag) => formatDateTime(pag.created_at),
              },
              {
                key: 'valor',
                header: 'Valor',
                render: (pag) => <span className="font-semibold">{formatMoney(pag.valor)}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (pag) => <StatusPagamentoBadge status={pag.status} />,
              },
            ]}
          />
        </section>
      </div>
    </PageScroll>
  )
}

function ProdutoSection({
  icon,
  bloco,
  onOpen,
}: {
  icon: ReactNode
  bloco?: DashboardProdutoBloco
  onOpen: () => void
}) {
  if (!bloco) return null
  const porStatus = bloco.por_status ?? []
  const novos = (bloco.novos_mensal ?? []).map(comLabelMesQuantidade)
  const temStatus = porStatus.some((item) => item.quantidade > 0)

  return (
    <SectionCard
      title={bloco.label}
      description={`${bloco.total} cadastro(s) · ${bloco.assinaturas_ativas ?? 0} assinatura(s) ativa(s)`}
      action={
        <button
          type="button"
          onClick={onOpen}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Ver lista
        </button>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashKpi delay={0} label="Total" value={bloco.total} icon={icon} />
        <DashKpi delay={1} label={bloco.destaque_label ?? 'Destaque'} value={bloco.destaque} tone="brand" />
        <DashKpi delay={2} label="Assinaturas ativas" value={bloco.assinaturas_ativas ?? 0} />
        <DashKpi delay={3} label="MRR estimado" value={formatMoney(bloco.mrr_estimado)} />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <ChartCard
          delay={4}
          title="Por status"
          height="h-64"
          footer={
            temStatus ? (
              <LegendList
                items={porStatus.map((item, index) => ({
                  chave: item.chave,
                  label: `${item.label ?? item.chave}: ${item.quantidade}`,
                  color: COLORS[index % COLORS.length],
                }))}
              />
            ) : null
          }
        >
          {temStatus ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porStatus} dataKey="quantidade" nameKey="label" innerRadius={50} outerRadius={80}>
                  {porStatus.map((entry, index) => (
                    <Cell key={entry.chave} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, String(name)]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard delay={5} title="Novos por mês" height="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={novos}>
              <CartesianGrid stroke="#e4e8df" vertical={false} />
              <XAxis dataKey="label_curto" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} novo(s)`, 'Quantidade']} />
              <Bar dataKey="quantidade" fill="#00c44a" radius={[8, 8, 0, 0]} name="Novos" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {(bloco.recentes?.length ?? 0) > 0 && (
        <Table
          rowKey={(item) => item.id}
          rows={bloco.recentes ?? []}
          columns={[
            {
              key: 'nome',
              header: 'Nome',
              render: (item) => <p className="font-semibold">{item.nome}</p>,
            },
            {
              key: 'cliente',
              header: 'Cliente',
              render: (item) => item.cliente_nome || '—',
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => item.status_label || item.status || '—',
            },
            {
              key: 'created',
              header: 'Criado',
              render: (item) => formatDateTime(item.created_at),
            },
          ]}
        />
      )}
    </SectionCard>
  )
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-b border-line p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function DashKpi({
  delay = 0,
  ...props
}: {
  delay?: number
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'brand' | 'warn'
}) {
  return (
    <KpiCard
      {...props}
      className="card-enter rounded-2xl"
      style={{ '--card-delay': `${delay * 55}ms` } as CSSProperties}
    />
  )
}

function ChartCard({
  title,
  hint,
  children,
  footer,
  height = 'h-72',
  delay = 0,
}: {
  title: string
  hint?: string
  children: ReactNode
  footer?: ReactNode
  height?: string
  delay?: number
}) {
  return (
    <div
      className="card-enter rounded-2xl border border-line bg-card p-5"
      style={{ '--card-delay': `${delay * 55}ms` } as CSSProperties}
    >
      <h3 className="font-display text-lg">{title}</h3>
      {hint ? <p className="mb-3 text-xs text-muted">{hint}</p> : <div className="mb-3" />}
      <div className={height}>{children}</div>
      {footer}
    </div>
  )
}

function EmptyChart() {
  return <p className="grid h-full place-items-center text-sm text-muted">Sem dados para mostrar.</p>
}

function LegendList({ items }: { items: Array<{ chave: string; label: string; color: string }> }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((item) => (
        <li key={item.chave} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function FunilRow({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="flex items-center justify-between border border-line px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold">
        {value}
        {hint ? <span className="ml-2 text-xs font-normal text-muted">{hint}</span> : null}
      </span>
    </div>
  )
}

function comLabelMes(ponto: PontoReceitaMensal) {
  return { ...ponto, label_curto: labelMesCurto(ponto.ano, ponto.mes) }
}

function comLabelMesQuantidade(ponto: PontoQuantidadeMensal) {
  return { ...ponto, label_curto: labelMesCurto(ponto.ano, ponto.mes) }
}

function labelMesCurto(ano: number, mes: number) {
  return `${MESES[mes - 1] ?? mes}/${String(ano).slice(2)}`
}

function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(value)
}

function sinalPercentual(value?: number | null) {
  const n = Number(value ?? 0)
  const texto = formatPercent(n)
  if (n > 0) return `+${texto}`
  return texto
}

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: PontoReceitaMensal }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const ponto = payload[0]?.payload
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-muted">
          {item.name}: <span className="font-semibold text-ink">{formatMoney(Number(item.value))}</span>
        </p>
      ))}
      {ponto ? (
        <p className="mt-1 text-muted">
          {ponto.quantidade_pagos ?? 0} pagos · {ponto.quantidade_pendentes ?? 0} pendentes
        </p>
      ) : null}
    </div>
  )
}
