import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
import { AlertTriangle, CreditCard, Globe, Users } from 'lucide-react'
import { obterDashboardInicio } from '@/lib/api/dashboard'
import { formatDateTime, formatMoney, formatPercent } from '@/lib/format'
import { STATUS_PAGAMENTO_LABEL, enumLabel } from '@/lib/labels'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusPagamentoBadge, StatusSiteBadge, TipoSiteBadge } from '@/components/status/badges'
import type { StatusPagamento, StatusSite, TipoSite } from '@/types/enums'
import { PageFill, PageScroll } from '@/components/ui/PageFrame'
import { Table } from '@/components/ui/Table'

const COLORS = ['#00c44a', '#0b1f14', '#d97706', '#0284c7', '#64748b', '#e11d48']

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-inicio'],
    queryFn: () => obterDashboardInicio({ meses: 12, limite_atividades: 8, limite_alertas: 8, limite_tops: 5 }),
  })

  if (isLoading) {
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

  const kpis = data.kpis
  const receita = data.series?.receita_mensal ?? []
  const sitesStatus = data.distribuicoes?.sites_por_status ?? []
  const pagamentosStatus = data.distribuicoes?.pagamentos_por_status ?? []

  return (
    <PageScroll>
      <PageHeader
        eyebrow={isAdmin ? 'Visão da operação' : 'Sua conta'}
        title={isAdmin ? 'O que está acontecendo agora' : 'Resumo da sua operação'}
        description={
          isAdmin
            ? 'Receita, assinaturas, clientes e os pontos que pedem atenção hoje.'
            : 'Acompanhe seus sites, cobranças e o status da assinatura.'
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isAdmin ? (
          <>
            <KpiCard
              label="Receita do mês"
              value={formatMoney(kpis?.receita_mes_atual)}
              hint={`MRR estimado ${formatMoney(kpis?.mrr_estimado)}`}
              icon={<CreditCard className="size-4" />}
              tone="brand"
            />
            <KpiCard
              label="Em aberto"
              value={formatMoney(kpis?.total_pendente)}
              hint={`${kpis?.quantidade_pendentes ?? 0} cobranças pendentes`}
              tone="warn"
            />
            <KpiCard
              label="Assinaturas ativas"
              value={kpis?.assinaturas_ativas ?? 0}
              hint={`${kpis?.total_clientes ?? 0} clientes`}
              icon={<Users className="size-4" />}
            />
            <KpiCard
              label="Sites e BioLinks"
              value={`${kpis?.total_sites ?? 0}`}
              hint={`${kpis?.total_biolinks ?? 0} BioLinks`}
              icon={<Globe className="size-4" />}
            />
          </>
        ) : (
          <>
            <KpiCard label="Pago no mês" value={formatMoney(kpis?.receita_mes_atual)} tone="brand" />
            <KpiCard label="Total pago" value={formatMoney(kpis?.total_pago)} />
            <KpiCard label="Em aberto" value={formatMoney(kpis?.total_pendente)} tone="warn" />
            <KpiCard label="Meus sites" value={kpis?.total_sites ?? 0} hint={`${kpis?.total_biolinks ?? 0} BioLinks`} />
          </>
        )}
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-xl">Receita mensal</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={receita}>
                <CartesianGrid stroke="#e4e8df" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Area type="monotone" dataKey="valor_pago" stroke="#00c44a" fill="#00c44a33" name="Pago" />
                <Area type="monotone" dataKey="valor_pendente" stroke="#c47a00" fill="#c47a0022" name="Pendente" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-xl">Sites por status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sitesStatus} dataKey="quantidade" nameKey="label" innerRadius={58} outerRadius={90}>
                  {sitesStatus.map((entry, index) => (
                    <Cell key={entry.chave} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-xl">Pagamentos por status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pagamentosStatus.map((i) => ({ ...i, label: enumLabel(STATUS_PAGAMENTO_LABEL, i.chave as StatusPagamento) }))}>
                <CartesianGrid stroke="#e4e8df" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#0f1c14" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {isAdmin && data.funil ? (
          <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-display text-xl">Funil de conversão</h3>
            <div className="space-y-3">
              <FunilRow label="Clientes" value={data.funil.clientes ?? 0} />
              <FunilRow label="Com site" value={data.funil.clientes_com_site ?? 0} hint={formatPercent((data.funil.taxas?.cliente_para_site ?? 0) * 100)} />
              <FunilRow label="Com assinatura" value={data.funil.clientes_com_assinatura ?? 0} hint={formatPercent((data.funil.taxas?.site_para_assinatura ?? 0) * 100)} />
              <FunilRow label="Com pagamento" value={data.funil.clientes_com_pagamento_pago ?? 0} hint={formatPercent((data.funil.taxas?.cliente_para_pago ?? 0) * 100)} />
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-display text-xl">Assinatura em destaque</h3>
            {data.assinatura_destaque?.ativa ? (
              <div>
                <p className="font-display text-3xl">{formatMoney(data.assinatura_destaque.valor)}</p>
                <p className="mt-2 text-sm text-muted">{data.assinatura_destaque.descricao}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma assinatura ativa no momento.</p>
            )}
          </section>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
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
                  if (alerta.entidade === 'SITE') navigate(isAdmin ? '/sites' : '/biolink')
                  if (alerta.entidade === 'ASSINATURA') navigate('/assinaturas')
                }}
                className="block w-full rounded-2xl bg-paper px-4 py-3 text-left"
              >
                <p className="text-sm font-semibold">{alerta.titulo}</p>
                <p className="mt-1 text-xs text-muted">{alerta.mensagem}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-line bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-xl">Últimos pagamentos</h3>
          <Table
            rowKey={(pag) => pag.id}
            empty={<p className="text-sm text-muted">Nenhum pagamento recente.</p>}
            rows={data.ultimos_pagamentos ?? []}
            columns={[
              {
                key: 'desc',
                header: 'Cobrança',
                render: (pag) => <p className="font-semibold">{pag.descricao}</p>,
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

      {(data.tops?.sites_recentes?.length ?? 0) > 0 && (
        <section className="mt-4 overflow-hidden rounded-3xl border border-line bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-xl">Sites recentes</h3>
          <Table
            rowKey={(site) => site.id}
            rows={data.tops?.sites_recentes ?? []}
            columns={[
              {
                key: 'nome',
                header: 'Site',
                render: (site) => <p className="font-semibold">{site.nome}</p>,
              },
              {
                key: 'cliente',
                header: 'Cliente',
                render: (site) => site.cliente_nome || '—',
              },
              {
                key: 'tipo',
                header: 'Tipo',
                render: (site) => <TipoSiteBadge tipo={site.tipo as TipoSite} />,
              },
              {
                key: 'status',
                header: 'Status',
                render: (site) => <StatusSiteBadge status={site.status as StatusSite} />,
              },
            ]}
          />
        </section>
      )}
    </PageScroll>
  )
}

function FunilRow({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold">
        {value}
        {hint ? <span className="ml-2 text-xs font-normal text-muted">{hint}</span> : null}
      </span>
    </div>
  )
}
