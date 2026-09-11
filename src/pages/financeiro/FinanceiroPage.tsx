import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { obterFinanceiroDashboard } from '@/lib/api/dashboard'
import { ultimosPagamentos } from '@/lib/api/pagamentos'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusPagamentoBadge } from '@/components/status/badges'
import { FORMA_PAGAMENTO_LABEL, enumLabel } from '@/lib/labels'
import { PageFill, PageScroll } from '@/components/ui/PageFrame'
import { Table } from '@/components/ui/Table'

export function FinanceiroPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const dash = useQuery({ queryKey: ['financeiro-dashboard'], queryFn: obterFinanceiroDashboard })
  const latest = useQuery({ queryKey: ['pagamentos-ultimos'], queryFn: ultimosPagamentos })

  if (dash.isLoading) {
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

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Caixa"
        title="Visão financeira"
        description="Totais, próxima cobrança e os últimos movimentos da conta."
        actions={
          isAdmin ? (
            <Button onClick={() => navigate('/pagamentos')}>Nova cobrança</Button>
          ) : undefined
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total pago" value={formatMoney(data.total_pago)} tone="brand" />
        <KpiCard label="Em aberto" value={formatMoney(data.total_pendente)} tone="warn" hint={`${data.quantidade_pendentes ?? 0} pendentes`} />
        <KpiCard label="Pagamentos" value={data.quantidade_pagamentos ?? 0} />
        <KpiCard
          label="Próxima cobrança"
          value={data.proxima_cobranca ? formatDate(data.proxima_cobranca) : '—'}
        />
      </div>

      <div className="grid xl:grid-cols-[0.8fr_1.2fr]">
        <section className="border-t border-line p-6 xl:border-r">
          <h3 className="mb-3 font-display text-xl">Assinatura</h3>
          {data.assinatura_ativa ? (
            <div>
              <p className="font-display text-3xl">{formatMoney(data.valor_assinatura)}</p>
              <p className="mt-2 text-sm text-muted">{data.descricao_assinatura}</p>
              <p className="mt-1 text-xs text-muted">
                {enumLabel(FORMA_PAGAMENTO_LABEL, data.metodo_pagamento_assinatura)}
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => navigate('/assinaturas')}>
                Ver assinaturas
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">Nenhuma assinatura ativa.</p>
          )}
        </section>

        <section className="overflow-hidden border-t border-line p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl">Últimos pagamentos</h3>
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
        </section>
      </div>
    </PageScroll>
  )
}
