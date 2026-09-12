import { Badge } from '@/components/ui/Badge'
import {
  CICLO_LABEL,
  ETAPA_PROJETO_LABEL,
  FORMA_PAGAMENTO_LABEL,
  SITUACAO_ASSINATURA_LABEL,
  STATUS_APLICATIVO_MOBILE_LABEL,
  STATUS_ASSINATURA_LABEL,
  STATUS_PAGAMENTO_LABEL,
  STATUS_SITE_LABEL,
  TIPO_PRODUTO_COBRANCA_LABEL,
  TIPO_PROJETO_LABEL,
  TIPO_SITE_LABEL,
  VINCULO_PLANO_LABEL,
  STATUS_LANDING_PAGE_LEAD_LABEL,
  enumLabel,
} from '@/lib/labels'
import type {
  CicloAssinatura,
  EtapaProjeto,
  FormaPagamento,
  SituacaoAssinaturaSite,
  StatusAplicativoMobile,
  StatusAssinatura,
  StatusPagamento,
  StatusSite,
  TipoProdutoCobranca,
  TipoProjeto,
  TipoSite,
  VinculoPlano,
  StatusLandingPageLead,
} from '@/types/enums'

export function StatusPagamentoBadge({ status }: { status?: StatusPagamento | null }) {
  const tone =
    status === 'RECEIVED' || status === 'CONFIRMED'
      ? 'success'
      : status === 'PENDING'
        ? 'warn'
        : status === 'OVERDUE' || status === 'FAILED'
          ? 'danger'
          : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_PAGAMENTO_LABEL, status)}</Badge>
}

export function StatusAssinaturaBadge({ status }: { status?: StatusAssinatura | null }) {
  const tone = status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_ASSINATURA_LABEL, status)}</Badge>
}

export function StatusSiteBadge({ status }: { status?: StatusSite | null }) {
  const tone =
    status === 'ATIVO' ? 'success' : status === 'EM_DESENVOLVIMENTO' ? 'warn' : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_SITE_LABEL, status)}</Badge>
}

export function StatusAplicativoMobileBadge({ status }: { status?: StatusAplicativoMobile | null }) {
  const tone =
    status === 'PRODUCAO'
      ? 'success'
      : status === 'DESENVOLVIMENTO'
        ? 'warn'
        : status === 'HOMOLOGACAO'
          ? 'info'
          : status === 'ENCERRADO'
            ? 'danger'
            : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_APLICATIVO_MOBILE_LABEL, status)}</Badge>
}

export function SituacaoBadge({ status }: { status?: SituacaoAssinaturaSite | null }) {
  const tone = status === 'EM_DIA' ? 'success' : status === 'VENCIDO' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{enumLabel(SITUACAO_ASSINATURA_LABEL, status)}</Badge>
}

export function TipoSiteBadge({ tipo }: { tipo?: TipoSite | null }) {
  return <Badge tone="info">{enumLabel(TIPO_SITE_LABEL, tipo)}</Badge>
}

export function TipoProdutoCobrancaBadge({ tipo }: { tipo?: TipoProdutoCobranca | null }) {
  return <Badge tone="info">{enumLabel(TIPO_PRODUTO_COBRANCA_LABEL, tipo)}</Badge>
}

export function TipoProjetoBadge({ tipo }: { tipo?: TipoProjeto | null }) {
  return <Badge tone="info">{enumLabel(TIPO_PROJETO_LABEL, tipo)}</Badge>
}

export function EtapaProjetoBadge({ etapa }: { etapa?: EtapaProjeto | null }) {
  const tone =
    etapa === 'CONCLUIDO'
      ? 'success'
      : etapa === 'EM_ANDAMENTO'
        ? 'brand'
        : etapa === 'HOMOLOGACAO'
          ? 'info'
          : etapa === 'CANCELADO'
            ? 'danger'
            : etapa === 'PAUSADO'
              ? 'neutral'
              : 'warn'
  return <Badge tone={tone}>{enumLabel(ETAPA_PROJETO_LABEL, etapa)}</Badge>
}

export function VinculoPlanoBadge({ vinculo }: { vinculo?: VinculoPlano | null }) {
  return <Badge tone="neutral">{enumLabel(VINCULO_PLANO_LABEL, vinculo)}</Badge>
}

export function StatusLandingPageLeadBadge({ status }: { status?: StatusLandingPageLead | null }) {
  const tone =
    status === 'CONVERTIDO'
      ? 'success'
      : status === 'PERDIDO'
        ? 'danger'
        : status === 'NEGOCIANDO'
          ? 'info'
          : status === 'EM_ATENDIMENTO'
            ? 'brand'
            : 'warn'
  return <Badge tone={tone}>{enumLabel(STATUS_LANDING_PAGE_LEAD_LABEL, status)}</Badge>
}

export function FormaBadge({ forma }: { forma?: FormaPagamento | null }) {
  return <Badge>{enumLabel(FORMA_PAGAMENTO_LABEL, forma)}</Badge>
}

export function CicloBadge({ ciclo }: { ciclo?: CicloAssinatura | null }) {
  return <Badge>{enumLabel(CICLO_LABEL, ciclo)}</Badge>
}
