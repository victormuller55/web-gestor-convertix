import { useState, type CSSProperties, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, CreditCard, Receipt, Wallet } from 'lucide-react'
import { obterFinanceiroDashboard } from '@/lib/api/dashboard'
import { ultimosPagamentos } from '@/lib/api/pagamentos'
import { currentMonthValue, formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { SituacaoBadge, StatusPagamentoBadge } from '@/components/status/badges'
import { CICLO_LABEL, FORMA_PAGAMENTO_LABEL, enumLabel } from '@/lib/labels'
import { PageFill, PageScroll } from '@/components/ui/PageFrame'
import { Table } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import type { AssinaturaAtivaDashboard } from '@/types/models'

function parseCompetencia(value: string) {
  const [ano, mes] = value.split('-').map(Number)
  return { ano, mes }
}

export function FinanceiroPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [competencia, setCompetencia] = useState(currentMonthValue)
  const { ano, mes } = parseCompetencia(competencia)
  const dash = useQuery({
    queryKey: ['financeiro-dashboard', ano, mes],
    queryFn: () => obterFinanceiroDashboard({ ano, mes }),
    placeholderData: (prev) => prev,
  })
  const latest = useQuery({ queryKey: ['pagamentos-ultimos'], queryFn: ultimosPagamentos })

  if (dash.isLoading && !dash.data) {
    return (
      <PageFill>
        <PageSpinner />
      </PageFill>
    )
  }
  if (!dash.data) {
    return (
      <PageFill>
        <EmptyState title="Não foi possível carregar o financeiro" />
      </PageFill>
    )
  }

  const data = dash.data
  const assinaturas = data.assinaturas_ativas ?? []

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Caixa"
        title="Visão financeira"
        description="Totais do mês, próxima cobrança em aberto e assinaturas ativas."
        actions={
          <>
            <Input
              type="month"
              label="Mês"
              className="w-full sm:w-44"
              value={competencia}
              onChange={(event) => setCompetencia(event.target.value || currentMonthValue())}
            />
            {isAdmin ? (
              <Button onClick={() => navigate('/pagamentos')}>Nova cobrança</Button>
            ) : undefined}
          </>
        }
      />

      <div className="p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashKpi
            delay={0}
            label="Total pago"
            value={formatMoney(data.total_pago)}
            hint="Recebido neste mês"
            icon={<Wallet className="size-4" />}
            tone="brand"
          />
          <DashKpi
            delay={1}
            label="Em aberto"
            value={formatMoney(data.total_pendente)}
            hint={`${data.quantidade_pendentes ?? 0} com vencimento no mês`}
            icon={<CreditCard className="size-4" />}
            tone="warn"
          />
          <DashKpi
            delay={2}
            label="Pagamentos"
            value={data.quantidade_pagamentos ?? 0}
            hint="Confirmados neste mês"
            icon={<Receipt className="size-4" />}
          />
          <DashKpi
            delay={3}
            label="Próxima cobrança"
            value={data.proxima_cobranca ? formatDate(data.proxima_cobranca) : '—'}
            hint="Próxima fatura em aberto"
            icon={<Calendar className="size-4" />}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <SoftCard delay={4}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg">Assinaturas ativas</h3>
                <p className="mt-1 text-xs text-muted">
                  {assinaturas.length === 0
                    ? 'Nenhum plano em cobrança.'
                    : `${assinaturas.length} ${assinaturas.length === 1 ? 'plano ativo' : 'planos ativos'} e a situação atual.`}
                </p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/assinaturas')}>
                Ver todas
              </Button>
            </div>
            {assinaturas.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma assinatura ativa.</p>
            ) : (
              <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
                {assinaturas.map((assinatura) => (
                  <AssinaturaAtivaRow key={assinatura.id} assinatura={assinatura} />
                ))}
              </ul>
            )}
          </SoftCard>

          <SoftCard delay={5} className="overflow-hidden">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg">Últimos pagamentos</h3>
                <p className="mt-1 text-xs text-muted">Movimentos recentes da conta.</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/pagamentos')}>
                Ver todos
              </Button>
            </div>
            <Table
              rowKey={(pag) => pag.id}
              empty={<p className="text-sm text-muted">Nenhum pagamento recente.</p>}
              rows={latest.data ?? []}
              columns={[
                {
                  key: 'desc',
                  header: 'Cobrança',
                  render: (pag) => <p className="font-semibold">{pag.descricao}</p>,
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
          </SoftCard>
        </div>
      </div>
    </PageScroll>
  )
}

function AssinaturaAtivaRow({ assinatura }: { assinatura: AssinaturaAtivaDashboard }) {
  const ciclo = assinatura.ciclo_label ?? enumLabel(CICLO_LABEL, assinatura.ciclo)
  const forma = enumLabel(FORMA_PAGAMENTO_LABEL, assinatura.forma_pagamento)
  const detalhe = [assinatura.cliente_nome, assinatura.produto_nome].filter(Boolean).join(' · ')

  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-semibold text-ink">{assinatura.descricao || 'Assinatura'}</p>
        {detalhe ? <p className="mt-0.5 truncate text-xs text-muted">{detalhe}</p> : null}
        <p className="mt-1 text-xs text-muted">
          {ciclo}
          {assinatura.forma_pagamento ? ` · ${forma}` : ''}
          {assinatura.proxima_cobranca ? ` · vence ${formatDate(assinatura.proxima_cobranca)}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-base text-ink">{formatMoney(assinatura.valor)}</p>
        <div className="mt-1 flex justify-end">
          <SituacaoBadge status={assinatura.situacao} />
        </div>
      </div>
    </li>
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

function SoftCard({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn('card-enter rounded-2xl border border-line bg-card p-5', className)}
      style={{ '--card-delay': `${delay * 55}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
